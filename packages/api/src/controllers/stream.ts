import { Router, Request } from "express";
import fetch from "node-fetch";
import { QueryResult } from "pg";
import sql from "sql-template-strings";
import { parse as parseUrl } from "url";
import { v4 as uuid } from "uuid";

import logger from "../logger";
import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { geolocateMiddleware } from "../middleware";
import { CliArgs } from "../parse-cli";
import {
  DetectionWebhookPayload,
  StreamHealthPayload,
  StreamPatchPayload,
  StreamSetActivePayload,
  User,
} from "../schema/types";
import { db } from "../store";
import { DBSession } from "../store/db";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnprocessableEntityError,
} from "../store/errors";
import { DBStream, StreamStats } from "../store/stream-table";
import { WithID } from "../store/types";
import messages from "../store/messages";
import { getBroadcasterHandler } from "./broadcaster";
import {
  generateUniquePlaybackId,
  generateUniqueStreamKey,
} from "./generate-keys";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  pathJoin,
  FieldsMap,
  toStringValues,
} from "./helpers";
import { terminateStream, listActiveStreams } from "./mist-api";
import wowzaHydrate from "./wowza-hydrate";
import Queue from "../store/queue";
import { toExternalSession } from "./session";
import { withPlaybackUrls } from "./asset";

type Profile = DBStream["profiles"][number];
type MultistreamOptions = DBStream["multistream"];
type MultistreamTargetRef = MultistreamOptions["targets"][number];

export const USER_SESSION_TIMEOUT = 60 * 1000; // 1 min
const ACTIVE_TIMEOUT = 90 * 1000; // 90 sec
const STALE_SESSION_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours

const DEFAULT_STREAM_FIELDS: Partial<DBStream> = {
  profiles: [
    { name: "240p0", fps: 0, bitrate: 250000, width: 426, height: 240 },
    { name: "360p0", fps: 0, bitrate: 800000, width: 640, height: 360 },
    { name: "480p0", fps: 0, bitrate: 1600000, width: 854, height: 480 },
    { name: "720p0", fps: 0, bitrate: 3000000, width: 1280, height: 720 },
  ],
};

const app = Router();
const hackMistSettings = (req: Request, profiles: Profile[]): Profile[] => {
  if (
    !req.headers["user-agent"] ||
    !req.headers["user-agent"].toLowerCase().includes("mistserver")
  ) {
    return profiles;
  }
  profiles = profiles || [];
  return profiles.map((profile) => {
    profile = {
      ...profile,
    };
    if (typeof profile.gop === "undefined") {
      profile.gop = "2.0";
    }
    if (typeof profile.fps === "undefined") {
      profile.fps = 0;
    }
    return profile;
  });
};

async function validateMultistreamTarget(
  userId: string,
  profileNames: Set<string>,
  target: MultistreamTargetRef
): Promise<Omit<MultistreamTargetRef, "spec">> {
  const { profile, id, spec } = target;
  if (!profileNames.has(profile)) {
    const available = JSON.stringify([...profileNames]);
    throw new BadRequestError(
      `multistream target profile not found: "${profile}". available: ${available}`
    );
  }
  if (!!spec === !!id) {
    throw new BadRequestError(
      `multistream target must have either an "id" or a "spec"`
    );
  }
  if (id) {
    if (!(await db.multistreamTarget.hasAccess(id, userId))) {
      throw new BadRequestError(`multistream target not found: "${id}"`);
    }
    return target;
  }
  const created = await db.multistreamTarget.fillAndCreate({
    name: spec.name,
    url: spec.url,
    userId,
  });
  const { spec: _, ...specless } = target;
  return { ...specless, id: created.id };
}

async function validateMultistreamOpts(
  userId: string,
  profiles: Profile[],
  multistream: MultistreamOptions
): Promise<MultistreamOptions> {
  const profileNames = new Set<string>();
  for (const { name } of profiles) {
    if (!name) {
      continue;
    } else if (name === "source") {
      throw new BadRequestError(`profile cannot be named "source"`);
    } else if (profileNames.has(name)) {
      throw new BadRequestError(`duplicate profile name "${name}"`);
    }
    profileNames.add(name);
  }
  profileNames.add("source");

  if (!multistream?.targets) {
    return { targets: [] };
  }
  const targets = await Promise.all(
    multistream.targets.map((t) =>
      validateMultistreamTarget(userId, profileNames, t)
    )
  );
  const uniqueIds = new Set(targets.map((t) => `${t.profile} -> ${t.id}`));
  if (uniqueIds.size !== targets.length) {
    throw new BadRequestError(`multistream target {id,profile} must be unique`);
  }
  return { targets };
}

async function validateStreamPlaybackPolicy(
  playbackPolicy: DBStream["playbackPolicy"],
  userId: string
) {
  if (
    playbackPolicy?.type === "lit_signing_condition" ||
    playbackPolicy?.resourceId ||
    playbackPolicy?.unifiedAccessControlConditions
  ) {
    throw new BadRequestError(
      `playbackPolicy type "lit_signing_condition" with a resourceId or unifiedAccessControlConditions is not supported for streams`
    );
  }
  if (playbackPolicy?.type == "webhook") {
    let webhook = await db.webhook.get(playbackPolicy.webhookId);
    if (!webhook || webhook.deleted) {
      throw new BadRequestError(
        `webhook ${playbackPolicy.webhookId} not found`
      );
    }
    if (webhook.userId !== userId) {
      throw new BadRequestError(
        `webhook ${playbackPolicy.webhookId} not found`
      );
    }
  }
}

async function triggerManyIdleStreamsWebhook(ids: string[], queue: Queue) {
  return Promise.all(
    ids.map(async (id) => {
      const stream = await db.stream.get(id);
      const user = await db.user.get(stream.userId);
      await queue.publishWebhook("events.stream.idle", {
        type: "webhook_event",
        id: uuid(),
        timestamp: Date.now(),
        event: "stream.idle",
        streamId: stream.id,
        userId: user.id,
      });
    })
  );
}

export function getHLSPlaybackUrl(ingest: string, stream: DBStream) {
  return pathJoin(ingest, `hls`, stream.playbackId, `index.m3u8`);
}

export function getWebRTCPlaybackUrl(ingest: string, stream: DBStream) {
  return pathJoin(ingest, `webrtc`, stream.playbackId);
}

async function getRecordingUrls(
  config: CliArgs,
  ingest: string,
  session: DBSession
): Promise<{ recordingUrl: string; mp4Url: string }> {
  // Recording V2
  if (session.version === "v2") {
    const asset = await db.asset.getBySessionId(session.id);
    if (!asset || ["waiting", "processing"].includes(asset.status?.phase)) {
      // Recording processing in progress
      return;
    }
    const assetWithPlayback = await withPlaybackUrls(config, ingest, asset);
    return {
      recordingUrl: assetWithPlayback.playbackUrl,
      mp4Url: assetWithPlayback.downloadUrl,
    };
  }

  // Backwards-compatibility for Recording V1
  const base = pathJoin(
    ingest,
    `recordings`,
    session.lastSessionId ?? session.id
  );
  return {
    recordingUrl: pathJoin(base, "index.m3u8"),
    mp4Url: pathJoin(base, "source.mp4"),
  };
}

function isActuallyNotActive(stream: DBStream) {
  return (
    stream.isActive &&
    !isNaN(stream.lastSeen) &&
    Date.now() - stream.lastSeen > ACTIVE_TIMEOUT
  );
}

function activeCleanupOne(
  config: CliArgs,
  stream: DBStream,
  queue: Queue,
  ingest: string
) {
  if (!isActuallyNotActive(stream)) {
    return false;
  }

  setImmediate(async () => {
    try {
      if (stream.parentId) {
        // this is a session so trigger the recording.ready logic to clean-up the isActive field
        await triggerSessionRecordingHooks(config, stream, queue, ingest);
      } else {
        const patch = { isActive: false };
        await setStreamActiveWithHooks(config, stream, patch, queue, ingest);
      }
    } catch (err) {
      logger.error("Error sending /setactive hooks err=", err);
    }
  });

  stream.isActive = false;
  return true;
}

function activeCleanup(
  config: CliArgs,
  streams: DBStream[],
  queue: Queue,
  ingest: string,
  filterToActiveOnly = false
) {
  let hasStreamsToClean: boolean;
  for (const stream of streams) {
    hasStreamsToClean = activeCleanupOne(config, stream, queue, ingest);
  }
  if (filterToActiveOnly && hasStreamsToClean) {
    return streams.filter((s) => !isActuallyNotActive(s));
  }
  return streams;
}

async function getIngestBase(req: Request) {
  const ingests = await req.getIngest();
  if (!ingests.length) {
    throw new InternalServerError("ingest not configured");
  }
  return ingests[0].base;
}

const fieldsMap: FieldsMap = {
  id: `stream.ID`,
  name: { val: `stream.data->>'name'`, type: "full-text" },
  sourceSegments: `stream.data->'sourceSegments'`,
  lastSeen: { val: `stream.data->'lastSeen'`, type: "int" },
  createdAt: { val: `stream.data->'createdAt'`, type: "int" },
  userId: `stream.data->>'userId'`,
  isActive: { val: `stream.data->'isActive'`, type: "boolean" },
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  parentId: `stream.data->>'parentId'`,
  record: { val: `stream.data->'record'`, type: "boolean" },
  suspended: { val: `stream.data->'suspended'`, type: "boolean" },
  sourceSegmentsDuration: {
    val: `stream.data->'sourceSegmentsDuration'`,
    type: "real",
  },
  transcodedSegments: { val: `stream.data->'transcodedSegments'`, type: "int" },
  transcodedSegmentsDuration: {
    val: `stream.data->'transcodedSegmentsDuration'`,
    type: "real",
  },
};

app.get("/", authorizer({}), async (req, res) => {
  let {
    limit,
    cursor,
    streamsonly,
    sessionsonly,
    all,
    active,
    nonLivepeerOnly,
    order,
    filters,
    userId,
    count,
  } = toStringValues(req.query);
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  if (!req.user.admin) {
    userId = req.user.id;
  }

  const query = parseFilters(fieldsMap, filters);
  if (!all || all === "false" || !req.user.admin) {
    query.push(sql`stream.data->>'deleted' IS NULL`);
  }
  if (req.user.admin) {
    if (nonLivepeerOnly && nonLivepeerOnly !== "false") {
      query.push(sql`users.data->>'email' NOT LIKE '%@livepeer.%'`);
    }
  }
  if (active && active !== "false") {
    query.push(sql`stream.data->>'isActive' = 'true'`);
  }
  if (streamsonly && streamsonly !== "false") {
    query.push(sql`stream.data->>'parentId' IS NULL`);
  } else if (sessionsonly && sessionsonly !== "false") {
    query.push(sql`stream.data->>'parentId' IS NOT NULL`);
  }
  if (userId) {
    query.push(sql`stream.data->>'userId' = ${userId}`);
  }

  if (!order) {
    order = "lastSeen-true,createdAt-true";
  }
  order = parseOrder(fieldsMap, order);

  type ResultRow = {
    id: string;
    data: DBStream;
    usersId: string;
    usersdata: WithID<User>;
    count?: number;
  };
  let fields =
    " stream.id as id, stream.data as data, users.id as usersId, users.data as usersdata";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `stream left join users on stream.data->>'userId' = users.id`;
  const [output, newCursor] = await db.stream.find(query, {
    limit,
    cursor,
    fields,
    from,
    order,
    process: ({ data, usersdata, count: c }: ResultRow) => {
      if (count) {
        res.set("X-Total-Count", c.toString());
      }
      return req.user.admin
        ? { ...data, user: db.user.cleanWriteOnlyResponse(usersdata) }
        : { ...data };
    },
  });

  const ingest = await getIngestBase(req);
  res.status(200);

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(
    activeCleanup(
      req.config,
      db.stream.addDefaultFieldsMany(
        db.stream.removePrivateFieldsMany(output, req.user.admin)
      ),
      req.queue,
      ingest,
      !!active
    )
  );
});

export async function getRecordingFields(
  config: CliArgs,
  ingest: string,
  session: DBSession,
  forceUrl: boolean
): Promise<Pick<DBSession, "recordingStatus" | "recordingUrl" | "mp4Url">> {
  if (!session.record) {
    return {};
  }

  const readyThreshold = Date.now() - USER_SESSION_TIMEOUT;
  const isReady = session.lastSeen > 0 && session.lastSeen < readyThreshold;
  const isUnused = !session.lastSeen && session.createdAt < readyThreshold;

  const recordingStatus = isReady ? "ready" : isUnused ? "none" : "waiting";
  if (!isReady && !forceUrl) {
    return { recordingStatus };
  }
  const recordingUrls = await getRecordingUrls(config, ingest, session);
  if (!recordingUrls) {
    return { recordingStatus: "waiting" };
  }
  if (!recordingUrls.recordingUrl) {
    return { recordingStatus: "none" };
  }
  return { recordingStatus, ...recordingUrls };
}

export async function withRecordingFields(
  config: CliArgs,
  ingest: string,
  session: DBSession,
  forceUrl: boolean
) {
  return {
    ...session,
    ...(await getRecordingFields(config, ingest, session, forceUrl)),
  };
}

// returns only 'user' sessions and adds
app.get("/:parentId/sessions", authorizer({}), async (req, res) => {
  const { parentId } = req.params;
  const { record, forceUrl } = req.query;
  let { limit, cursor } = toStringValues(req.query);
  const raw = req.query.raw && req.user.admin;

  const stream = await db.stream.get(parentId);
  if (
    !stream ||
    (stream.deleted && !req.isUIAdmin) ||
    (stream.userId !== req.user.id && !req.isUIAdmin)
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  let filterOut;
  const query = [];
  query.push(sql`data->>'parentId' = ${stream.id}`);
  query.push(sql`(data->'lastSeen')::bigint > 0`);
  query.push(sql`(data->'sourceSegmentsDuration')::bigint > 0`);
  query.push(sql`data->>'partialSession' IS NULL`);
  if (record) {
    if (record === "true" || record === "1") {
      query.push(sql`data->>'record' = 'true'`);
      query.push(sql`data->>'recordObjectStoreId' IS NOT NULL`);
    } else if (record === "false" || record === "0") {
      query.push(sql`data->>'recordObjectStoreId' IS NULL`);
      filterOut = true;
    }
  }

  let [sessions] = await db.session.find(query, {
    order: `data->'lastSeen' DESC NULLS LAST`,
    limit,
    cursor,
  });

  const ingest = await getIngestBase(req);
  sessions = await Promise.all(
    sessions.map(async (session) => {
      if (session.version !== "v2") {
        session = await db.stream.get(session.id);
      }

      if (!session) {
        return;
      }

      session = await withRecordingFields(
        req.config,
        ingest,
        session,
        !!forceUrl
      );
      if (!raw) {
        if (session.previousSessions && session.previousSessions.length) {
          session.id = session.previousSessions[0]; // return id of the first session object so
          // user always see same id for the 'user' session
        }
        const combinedStats = getCombinedStats(
          session,
          session.previousStats || {}
        );
        return {
          ...session,
          ...combinedStats,
          createdAt: session.userSessionCreatedAt || session.createdAt,
        };
      }
      return session;
    })
  );

  if (filterOut) {
    sessions = sessions.filter((sess) => !sess.record);
  }

  res.status(200);
  if (!raw) {
    db.stream.removePrivateFieldsMany(sessions, req.user.admin);
  }
  res.json(db.stream.addDefaultFieldsMany(sessions));
});

app.get("/sessions/:parentId", authorizer({}), async (req, res) => {
  const { parentId } = req.params;
  const { limit, cursor } = toStringValues(req.query);
  logger.info(`cursor params ${cursor}, limit ${limit}`);

  const stream = await db.stream.get(parentId);
  if (
    !stream ||
    stream.deleted ||
    (stream.userId !== req.user.id && !req.isUIAdmin)
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  const { data, cursor: nextCursor } = await req.store.queryObjects<DBStream>({
    kind: "stream",
    query: { parentId },
    cursor,
    limit,
  });
  res.status(200);
  if (data.length > 0 && nextCursor) {
    res.links({ next: makeNextHREF(req, nextCursor) });
  }
  res.json(
    db.stream.addDefaultFieldsMany(
      db.stream.removePrivateFieldsMany(data, req.user.admin)
    )
  );
});

app.get("/user/:userId", authorizer({}), async (req, res) => {
  const { userId } = req.params;
  let { limit, cursor, streamsonly, sessionsonly } = toStringValues(req.query);

  if (req.user.admin !== true && req.user.id !== req.params.userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own streams"],
    });
  }

  const query = [
    sql`data->>'deleted' IS NULL`,
    sql`data->>'userId' = ${userId}`,
  ];
  if (streamsonly) {
    query.push(sql`data->>'parentId' IS NULL`);
  } else if (sessionsonly) {
    query.push(sql`data->>'parentId' IS NOT NULL`);
  }

  const [streams, newCursor] = await db.stream.find(query, {
    cursor,
    limit,
    order: `data->'lastSeen' DESC NULLS LAST, data->'createdAt' DESC NULLS LAST`,
  });

  const ingest = await getIngestBase(req);
  res.status(200);

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(
    activeCleanup(
      req.config,
      db.stream.addDefaultFieldsMany(
        db.stream.removePrivateFieldsMany(streams, req.user.admin)
      ),
      req.queue,
      ingest
    )
  );
});

app.get("/:id", authorizer({}), async (req, res) => {
  const raw = req.query.raw && req.user.admin;
  const { forceUrl } = req.query;
  let stream = await db.stream.get(req.params.id);
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.user.admin)
  ) {
    // do not reveal that stream exists
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  activeCleanupOne(req.config, stream, req.queue, await getIngestBase(req));
  // fixup 'user' session
  if (!raw && stream.lastSessionId) {
    const lastSession = await db.stream.get(stream.lastSessionId);
    if (!lastSession) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }
    lastSession.createdAt = stream.createdAt;
    // for 'user' session we're returning stats which
    // is a sum of all sessions
    const combinedStats = getCombinedStats(
      lastSession,
      lastSession.previousStats || {}
    );
    stream = {
      ...lastSession,
      ...combinedStats,
    };
  }
  res.status(200);
  if (!raw) {
    db.stream.removePrivateFields(stream, req.user.admin);
  }
  res.json(db.stream.addDefaultFields(stream));
});

// returns stream by steamKey
app.get("/playback/:playbackId", authorizer({}), async (req, res) => {
  console.log(`headers:`, req.headers);
  const {
    data: [stream],
  } = await req.store.queryObjects<DBStream>({
    kind: "stream",
    query: { playbackId: req.params.playbackId },
  });
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.user.admin)
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  res.status(200);
  res.json(
    db.stream.addDefaultFields(
      db.stream.removePrivateFields(stream, req.user.admin)
    )
  );
});

// returns stream by steamKey
app.get("/key/:streamKey", authorizer({}), async (req, res) => {
  const useReplica = req.query.main !== "true";
  const [docs] = await db.stream.find(
    { streamKey: req.params.streamKey },
    { useReplica }
  );
  if (
    !docs.length ||
    ((docs[0].userId !== req.user.id || docs[0].deleted) && !req.user.admin)
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  res.status(200);
  res.json(
    db.stream.addDefaultFields(
      db.stream.removePrivateFields(docs[0], req.user.admin)
    )
  );
});

// Needed for Mist server
app.get(
  "/:streamId/broadcaster",
  geolocateMiddleware({}),
  getBroadcasterHandler
);

app.post(
  "/:streamId/stream",
  authorizer({}),
  validatePost("stream"),
  async (req, res) => {
    if (!req.body || !req.body.name) {
      res.status(422);
      return res.json({
        errors: ["missing name"],
      });
    }
    const start = Date.now();
    let stream: DBStream;
    let useParentProfiles = false;
    if (req.config.baseStreamName === req.params.streamId) {
      if (!req.body.name.includes("+")) {
        res.status(422);
        return res.json({
          errors: ["wrong name"],
        });
      }
      const playbackId = req.body.name.split("+")[1];
      const [docs] = await db.stream.find(
        { playbackId },
        { useReplica: false }
      );
      if (docs.length) {
        stream = docs[0];
        useParentProfiles = true;
      }
    } else {
      stream = await db.stream.get(req.params.streamId);
    }

    if (
      !stream ||
      ((stream.userId !== req.user.id || stream.deleted) &&
        !(req.user.admin && !stream.deleted))
    ) {
      // do not reveal that stream exists
      res.status(404);
      return res.json({ errors: ["not found"] });
    }

    const sessionId = req.query.sessionId?.toString();
    const region = req.config.ownRegion;

    // The first four letters of our playback id are the shard key.
    const id = stream.playbackId.slice(0, 4) + uuid().slice(4);
    const createdAt = Date.now();

    const record = stream.record;
    const recordObjectStoreId =
      stream.recordObjectStoreId ||
      (record ? req.config.recordObjectStoreId : undefined);
    const childStream: DBStream = wowzaHydrate({
      ...req.body,
      kind: "stream",
      userId: stream.userId,
      renditions: {},
      objectStoreId: stream.objectStoreId,
      record,
      recordObjectStoreId,
      sessionId,
      id,
      createdAt,
      parentId: stream.id,
      region,
      lastSeen: 0,
      isActive: true,
    });
    childStream.profiles = hackMistSettings(
      req,
      useParentProfiles ? stream.profiles : childStream.profiles
    );

    if (await db.session.get(sessionId)) {
      logger.info(
        `user session re-used for session.id=${sessionId} stream.id=${stream.id} stream.name='${stream.name}' playbackid=${stream.playbackId}`
      );
    } else {
      const session: DBSession = {
        id: sessionId,
        parentId: stream.id,
        playbackId: stream.playbackId,
        userId: stream.userId,
        kind: "session",
        version: "v2",
        name: req.body.name,
        createdAt,
        lastSeen: 0,
        sourceSegments: 0,
        transcodedSegments: 0,
        sourceSegmentsDuration: 0,
        transcodedSegmentsDuration: 0,
        sourceBytes: 0,
        transcodedBytes: 0,
        ingestRate: 0,
        outgoingRate: 0,
        deleted: false,
        profiles: childStream.profiles,
        record,
        recordObjectStoreId,
        recordingStatus: record ? "waiting" : undefined,
      };
      await db.session.create(session);
      if (record) {
        const ingest = await getIngestBase(req);
        await publishRecordingStartedHook(
          req.config,
          session,
          req.queue,
          ingest
        ).catch((err) => {
          logger.error("Error sending recording.started hook err=", err);
        });
      }
    }

    await db.stream.create(childStream);

    res.status(201);
    res.json(db.stream.removePrivateFields(childStream, req.user.admin));
    logger.info(
      `stream session created for stream_id=${stream.id} stream_name='${
        stream.name
      }' playbackid=${stream.playbackId} session_id=${id} elapsed=${
        Date.now() - start
      }ms`
    );
  }
);

app.post(
  "/hook/health",
  authorizer({ anyAdmin: true }),
  validatePost("stream-health-payload"),
  async (req, res) => {
    const start = Date.now();
    const payload = req.body as StreamHealthPayload;

    // parse playback ID from the mist stream name like videorec+<playbackId>
    if (!payload.stream_name.includes("+")) {
      throw new UnprocessableEntityError("stream name missing base name");
    }
    const playbackId = payload.stream_name.split("+", 2)[1];

    const stream = await db.stream.getByPlaybackId(playbackId, {
      useReplica: false,
    });
    if (!stream) {
      // allow calling this for deleted or suspended streams, we don't want to
      // lose the data if they are already live.
      throw new NotFoundError("stream not found");
    }

    // TODO: set the isActive field based on the payload as well (need
    // compatibility with /setactive recordging/webhooks handling)
    const { is_active, is_healthy } = payload;
    const issues =
      is_active && !is_healthy
        ? payload.human_issues ||
          (payload.issues ? [payload.issues] : undefined)
        : undefined;
    const patch: Partial<DBSession & DBStream> = {
      isHealthy: is_active ? is_healthy : undefined,
      issues,
      // do not clear the `lastSeen` field when the stream is not active
      ...(!is_active
        ? null
        : { lastSeen: Date.now(), ...streamPlaybackLatencies(payload) }),
    };

    // Since we might need to delete some fields, use replace instead of update
    await db.stream.replace({ ...stream, ...patch });

    if (payload.session_id) {
      const session = await db.session.get(payload.session_id, {
        useReplica: false,
      });
      if (session) {
        await db.session.replace({ ...session, ...patch });
      } else {
        logger.warn(
          `stream-health-payload: session not found for stream_id=${stream.id} session_id=${payload.session_id}`
        );
      }
    }

    // Log all the received payload for internal debugging (we don't expose all
    // the info on the stream object for now).
    console.log(
      `stream-health: processed stream health hook for ` +
        `stream_id=${stream.id} elapsed=${Date.now() - start}ms ` +
        `stream_name=${stream.name} session_id=${payload.session_id} ` +
        `is_active=${payload.is_active} is_healthy=${payload.is_healthy} ` +
        `issues=${payload.issues} human_issues=${payload.human_issues} ` +
        `extra=${JSON.stringify(payload.extra)} ` +
        `tracks=${JSON.stringify(payload.tracks)}`
    );

    res.status(204).end();
  }
);

const currMultiNodeHopCount = 2;

function streamPlaybackLatencies(
  health: StreamHealthPayload
): Pick<DBStream, "hlsPlaybackLatencyMs" | "webrtcPlaybackLatencyMs"> {
  const jitter = health.extra?.jitter as number;

  const maxGopMs = Object.values(health.tracks ?? [])
    .map((t) => t.keys?.ms_max ?? 0)
    .reduce((a, b) => Math.max(a, b), 0);

  if (!jitter || !maxGopMs) {
    return {};
  }

  // 100 and 50 below are guesstimations of the average ping between regions
  return {
    hlsPlaybackLatencyMs: jitter + 100 * currMultiNodeHopCount + 7 * maxGopMs,
    webrtcPlaybackLatencyMs: jitter + 50 * currMultiNodeHopCount,
  };
}

app.post("/", authorizer({}), validatePost("stream"), async (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(422);
    return res.json({
      errors: ["missing name"],
    });
  }
  const id = uuid();
  const createdAt = Date.now();
  const streamKey = await generateUniqueStreamKey(id);
  let playbackId = await generateUniquePlaybackId(id, [streamKey]);
  if (req.user.isTestUser) {
    playbackId += "-test";
  }

  let objectStoreId;
  if (req.body.objectStoreId) {
    const store = await db.objectStore.get(req.body.objectStoreId);
    if (!store || store.deleted || store.disabled) {
      return res.status(400).json({
        errors: [
          `object store ${req.body.objectStoreId} not found or disabled`,
        ],
      });
    }
  }

  const doc: DBStream = wowzaHydrate({
    ...DEFAULT_STREAM_FIELDS,
    ...req.body,
    kind: "stream",
    userId: req.user.id,
    renditions: {},
    objectStoreId,
    id,
    createdAt,
    streamKey,
    playbackId,
    createdByTokenName: req.token?.name,
    createdByTokenId: req.token?.id,
    isActive: false,
    lastSeen: 0,
  });
  await validateStreamPlaybackPolicy(doc.playbackPolicy, req.user.id);

  doc.profiles = hackMistSettings(req, doc.profiles);
  doc.multistream = await validateMultistreamOpts(
    req.user.id,
    doc.profiles,
    doc.multistream
  );

  await req.store.create(doc);

  res.status(201);
  res.json(
    db.stream.addDefaultFields(
      db.stream.removePrivateFields(doc, req.user.admin)
    )
  );
});

app.put(
  "/:id/setactive",
  authorizer({ anyAdmin: true }),
  validatePost("stream-set-active-payload"),
  async (req, res) => {
    const { id } = req.params;
    const { active, startedAt, hostName } = req.body as StreamSetActivePayload;
    logger.info(
      `got /setactive for stream=${id} active=${active} hostName=${hostName} startedAt=${startedAt}`
    );

    const stream = await db.stream.get(id, { useReplica: false });
    if (!stream || (stream.deleted && !req.user.admin)) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }

    if (active && stream.suspended) {
      res.status(403);
      return res.json({ errors: ["stream is suspended"] });
    }

    const user = await db.user.get(stream.userId);
    if (!user) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }

    if (active && user.suspended) {
      res.status(403);
      return res.json({ errors: ["user is suspended"] });
    }

    const isActiveChanged = stream.isActive !== active;
    const mediaServerChanged =
      stream.region !== req.config.ownRegion || stream.mistHost !== hostName;
    if (isActiveChanged && !active && mediaServerChanged) {
      // This means the user is doing multiple sessions with the same stream
      // key. We only support 1 conc. session so keep the last to have started.
      logger.info(
        `Ignoring /setactive false since another session had already started. ` +
          `stream=${id} currMist="${stream.region}-${stream.mistHost}" oldMist="${req.config.ownRegion}-${hostName}"`
      );
      return res.status(204).end();
    }

    const ingest = await getIngestBase(req);
    const patch = {
      isActive: active,
      // initialize isHealthy to true on stream initialization
      isHealthy: stream.isHealthy ?? (active ? true : undefined),
      lastSeen: Date.now(),
      mistHost: hostName,
      region: req.config.ownRegion,
    };
    await setStreamActiveWithHooks(
      req.config,
      stream,
      patch,
      req.queue,
      ingest
    );

    // update the other auxiliary info in the database in background.
    setImmediate(async () => {
      try {
        if (isActiveChanged && active) {
          await db.user.update(stream.userId, {
            lastStreamedAt: Date.now(),
          });
        }

        if (stream.parentId) {
          const pStream = await db.stream.get(stream.parentId);
          if (pStream && !pStream.deleted) {
            await db.stream.update(pStream.id, patch);
          }
        }
      } catch (err) {
        logger.error(
          "Error updating aux info from /setactive in database err=",
          err
        );
      }
    });

    res.status(204).end();
  }
);

/**
 * Updates the isActive field synchronously on the DB and sends corresponding
 * webhooks if appropriate.
 *
 * @param stream The stream to update which MUST be a parent stream (no
 * parentId). Child streams are processed through the delayed `recording.ready`
 * events from {@link triggerSessionRecordingHooks}.
 */
async function setStreamActiveWithHooks(
  config: CliArgs,
  stream: DBStream,
  patch: Partial<DBStream> & { isActive: boolean },
  queue: Queue,
  ingest: string
) {
  if (stream.parentId) {
    throw new Error(
      "must only set stream active synchronously for parent streams"
    );
  }

  await db.stream.update(stream.id, patch);

  const changed =
    stream.isActive !== patch.isActive ||
    stream.region !== patch.region ||
    stream.mistHost !== patch.mistHost;
  const isStaleCleanup = !patch.isActive && isStreamStale(stream);

  if (changed && !isStaleCleanup) {
    const event = patch.isActive ? "stream.started" : "stream.idle";
    await queue
      .publishWebhook(`events.${event}`, {
        type: "webhook_event",
        id: uuid(),
        timestamp: Date.now(),
        streamId: stream.id,
        event: event,
        userId: stream.userId,
      })
      .catch((err) => {
        logger.error(
          `Error sending /setactive hooks stream_id=${stream.id} event=${event} err=`,
          err
        );
      });
  }

  // opportunistically trigger recording.ready logic for this stream's sessions
  triggerSessionRecordingHooks(config, stream, queue, ingest).catch((err) => {
    logger.error(
      `Error triggering session recording hooks stream_id=${stream.id} err=`,
      err
    );
  });
}

/**
 * Trigger delayed recording.ready events for each active session in the stream.
 * These recording.ready events aren't sent directly to the user, but instead
 * the handler will check if the session is actually inactive to fire the hook.
 */
async function triggerSessionRecordingHooks(
  config: CliArgs,
  stream: DBStream,
  queue: Queue,
  ingest: string
) {
  const { id, parentId } = stream;
  let childStreams = parentId
    ? [stream]
    : await db.stream.getActiveSessions(id);

  for (const childStream of childStreams) {
    const sessionId = childStream.sessionId ?? childStream.id;
    const session = await db.session.get(sessionId);
    await publishSingleRecordingReadyHook(config, session, queue, ingest).catch(
      (err) => {
        logger.error(
          `Error sending recording.ready hook for session_id=${session.id} err=`,
          err
        );
      }
    );
  }
}

async function publishSingleRecordingReadyHook(
  config: CliArgs,
  session: DBSession,
  queue: Queue,
  ingest: string
) {
  const isStale = isStreamStale(session);
  if (!session.record || isStale) {
    if (isStale) {
      logger.info(
        `Skipping recording for stale session ` +
          `session_id=${session.id} last_seen=${session.lastSeen}`
      );
    }
    return;
  }

  await publishDelayedRecordingReadyHook(config, session, queue, ingest);
}

async function publishRecordingStartedHook(
  config: CliArgs,
  session: DBSession,
  queue: Queue,
  ingest: string
) {
  return queue.publishWebhook("events.recording.started", {
    type: "webhook_event",
    id: uuid(),
    timestamp: Date.now(),
    streamId: session.parentId,
    userId: session.userId,
    event: "recording.started",
    payload: { session: await toExternalSession(config, session, ingest) },
  });
}

/**
 * We don't actually send the webhook here, but schedule an event after a timeout.
 */
async function publishDelayedRecordingReadyHook(
  config: CliArgs,
  session: DBSession,
  queue: Queue,
  ingest: string
) {
  return await queue.delayedPublishWebhook(
    "events.recording.ready",
    {
      type: "webhook_event",
      id: uuid(),
      timestamp: Date.now(),
      streamId: session.parentId,
      event: "recording.ready",
      userId: session.userId,
      sessionId: session.id,
      payload: {
        session: {
          ...(await toExternalSession(config, session, ingest, true)),
          recordingStatus: "ready", // recording will be ready if this webhook is actually sent
          assetId: session.id,
        },
      },
    },
    USER_SESSION_TIMEOUT + 10_000
  );
}

/**
 * A stream (or session, a child stream) is considered stale if it is too old
 * for us to send a webhook about it. This can happen on background clean-up
 * ops, in which case we just update the DB silently without sending hooks.
 */
function isStreamStale(s: DBStream, lastSessionStartedAt?: number) {
  const staleThreshold =
    (lastSessionStartedAt ?? Date.now()) - STALE_SESSION_TIMEOUT;
  return s.lastSeen && s.lastSeen < staleThreshold;
}

// sets 'isActive' field to false for many objects at once
app.patch(
  "/deactivate-many",
  authorizer({ anyAdmin: true }),
  validatePost("deactivate-many-payload"),
  async (req, res) => {
    let upRes: QueryResult;
    try {
      upRes = await db.stream.markIsActiveFalseMany(req.body.ids);

      // trigger the webhooks
      try {
        await triggerManyIdleStreamsWebhook(req.body.ids, req.queue);
      } catch (err) {
        console.error(`error while triggering the many idle webhooks`, err);
      }

      if (upRes.rowCount) {
        console.log(
          `set isActive=false for ids=${req.body.ids} rowCount=${upRes.rowCount}`
        );
      }
    } catch (e) {
      console.error(
        `error setting stream active to false ids=${req.body.ids} err=${e}`
      );
      upRes = { rowCount: 0 } as QueryResult;
    }

    res.status(200);
    return res.json({ rowCount: upRes?.rowCount ?? 0 });
  }
);

app.patch(
  "/:id",
  authorizer({}),
  validatePost("stream-patch-payload"),
  async (req, res) => {
    const { id } = req.params;
    const payload = req.body as StreamPatchPayload;

    const stream = await db.stream.get(id);

    const exists = stream && !stream.deleted;
    const hasAccess = stream?.userId === req.user.id || req.isUIAdmin;
    if (!exists || !hasAccess) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }
    if (stream.parentId) {
      res.status(400);
      return res.json({ errors: ["can't patch stream session"] });
    }

    let { record, suspended, multistream, playbackPolicy } = payload;
    let patch: StreamPatchPayload = {};
    if (typeof record === "boolean") {
      patch = { ...patch, record };
    }
    if (typeof suspended === "boolean") {
      patch = { ...patch, suspended };
    }
    if (multistream) {
      multistream = await validateMultistreamOpts(
        req.user.id,
        stream.profiles,
        multistream
      );
      patch = { ...patch, multistream };
    }
    await validateStreamPlaybackPolicy(playbackPolicy, req.user.id);
    if (playbackPolicy) {
      patch = { ...patch, playbackPolicy };
    }
    if (Object.keys(patch).length === 0) {
      return res.status(204).end();
    }

    await db.stream.update(stream.id, patch);
    if (patch.suspended) {
      // kill live stream
      await terminateStreamReq(req, stream);
    }

    res.status(204);
    res.end();
  }
);

app.patch("/:id/record", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const stream = await db.stream.get(id);
  if (!stream || stream.deleted) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (stream.parentId) {
    res.status(400);
    return res.json({ errors: ["can't set for session"] });
  }
  if (req.body.record === undefined) {
    res.status(400);
    return res.json({ errors: ["record field required"] });
  }
  console.log(`set stream ${id} record ${req.body.record}`);

  await db.stream.update(stream.id, { record: !!req.body.record });

  res.status(204);
  res.end();
});

app.delete("/:id", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const stream = await db.stream.get(id);
  if (
    !stream ||
    stream.deleted ||
    (stream.userId !== req.user.id && !req.user.admin)
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  await db.stream.update(stream.id, {
    deleted: true,
  });
  // now kill live stream
  await terminateStreamReq(req, stream);
  res.status(204);
  res.end();
});

app.delete("/", authorizer({}), async (req, res) => {
  if (!req.body || !req.body.ids || !req.body.ids.length) {
    res.status(422);
    return res.json({
      errors: ["missing ids"],
    });
  }
  const ids = req.body.ids;

  if (!req.user.admin) {
    const streams = await db.stream.getMany(ids);
    if (
      streams.length !== ids.length ||
      streams.some((s) => s.userId !== req.user.id)
    ) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }
  }
  await db.stream.markDeletedMany(ids);

  res.status(204);
  res.end();
});

app.get("/:id/info", authorizer({}), async (req, res) => {
  let { id } = req.params;
  let stream = await db.stream.getByStreamKey(id);
  let session,
    isPlaybackid = false,
    isStreamKey = !!stream,
    isSession = false;
  if (!stream) {
    stream = await db.stream.getByPlaybackId(id);
    isPlaybackid = !!stream;
  }
  if (!stream) {
    stream = await db.stream.get(id);
  }
  if (stream && stream.parentId) {
    session = stream;
    isSession = true;
    stream = await db.stream.get(stream.parentId);
  }
  if (
    !stream ||
    (!req.user.admin && (stream.deleted || stream.userId !== req.user.id))
  ) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }
  activeCleanupOne(req.config, stream, req.queue, await getIngestBase(req));
  if (!session) {
    // find last session
    session = await db.stream.getLastSession(stream.id);
    if (session) {
      session = db.stream.addDefaultFields(session);
    }
  }
  const user = await db.user.get(stream.userId);
  const resp = {
    stream: db.stream.addDefaultFields(
      db.stream.removePrivateFields(stream, req.user.admin)
    ),
    session,
    isPlaybackid,
    isSession,
    isStreamKey,
    user: req.user.admin ? user : undefined,
  };

  res.status(200);
  res.json(resp);
});

app.patch("/:id/suspended", authorizer({}), async (req, res) => {
  const { id } = req.params;
  if (
    !req.body ||
    !Object.prototype.hasOwnProperty.call(req.body, "suspended") ||
    typeof req.body.suspended !== "boolean"
  ) {
    res.status(422);
    return res.json({
      errors: ["missing suspended property"],
    });
  }
  const { suspended } = req.body;
  const stream = await db.stream.get(id);
  if (
    !stream ||
    (!req.user.admin && (stream.deleted || stream.userId !== req.user.id))
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  await db.stream.update(stream.id, { suspended });
  if (suspended) {
    // now kill live stream
    await terminateStreamReq(req, stream);
  }
  res.status(204);
  res.end();
});

app.delete("/:id/terminate", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const stream = await db.stream.get(id);
  if (
    !stream ||
    (!req.user.admin && (stream.deleted || stream.userId !== req.user.id))
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  const { status, result, errors } = await terminateStreamReq(req, stream);
  res.status(status);
  return res.json({ result, errors });
});

export async function terminateStreamReq(
  req: Request,
  stream: DBStream
): Promise<{ status: number; errors?: string[]; result?: boolean | any }> {
  if (!stream.isActive) {
    return { status: 410, errors: ["not active"] };
  }
  if (!stream.region) {
    return { status: 400, errors: ["region not found"] };
  }
  if (!stream.mistHost) {
    return { status: 400, errors: ["Mist host not found"] };
  }

  const mistHost = stream.mistHost;
  const { ownRegion, mistUsername, mistPassword, mistPort } = req.config;
  if (!ownRegion || !mistPassword || !mistUsername) {
    return { status: 500, errors: ["server not properly configured"] };
  }
  if (stream.region != ownRegion) {
    // redirect request to other region
    const protocol =
      req.headers["x-forwarded-proto"] === "https" ? "https" : "http";

    const backendDomain = req.frontendDomain.replace(
      "livepeer.studio",
      "livepeer.com"
    );
    const regionalUrl = `${protocol}://${stream.region}.${backendDomain}/api/stream/${stream.id}/terminate`;
    const redRes = await fetch(regionalUrl, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        authorization: req.headers.authorization,
      },
    });
    const body = await redRes.json();
    const { result, errors } = body;
    return { status: redRes.status, result, errors };
  }
  const streams: string[] = await listActiveStreams(
    mistHost,
    mistPort,
    mistUsername,
    mistPassword
  );
  const mistStreamName = streams.find((sn) => sn.endsWith(stream.playbackId));
  if (!mistStreamName) {
    return { status: 200, result: false, errors: ["not found on Mist"] };
  }

  const nukeRes: boolean = await terminateStream(
    mistHost,
    mistPort,
    mistStreamName,
    mistUsername,
    mistPassword
  );
  return { status: 200, result: nukeRes };
}

// Hooks

app.post("/hook", authorizer({ anyAdmin: true }), async (req, res) => {
  if (!req.body || !req.body.url) {
    res.status(422);
    return res.json({
      errors: ["missing url"],
    });
  }
  // logger.info(`got webhook: ${JSON.stringify(req.body)}`)
  // These are of the form /live/:manifestId/:segmentNum.ts
  let { pathname, protocol } = parseUrl(req.body.url);
  // Protocol is sometimes undefined, due to https://github.com/livepeer/go-livepeer/issues/1006
  if (!protocol) {
    protocol = "http:";
  }
  if (protocol === "https:") {
    protocol = "http:";
  }
  if (protocol !== "http:" && protocol !== "rtmp:") {
    res.status(422);
    return res.json({ errors: [`unknown protocol: ${protocol}`] });
  }

  // Allowed patterns, for now:
  // http(s)://broadcaster.example.com/live/:streamId/:segNum.ts
  // rtmp://broadcaster.example.com/live/:streamId
  const [live, streamId, ...rest] = pathname.split("/").filter((x) => !!x);
  // logger.info(`live=${live} streamId=${streamId} rest=${rest}`)

  if (!streamId) {
    res.status(401);
    return res.json({ errors: ["stream key is required"] });
  }
  if (protocol === "rtmp:" && rest.length > 0) {
    res.status(422);
    return res.json({
      errors: [
        "RTMP address should be rtmp://example.com/live. Stream key should be a UUID.",
      ],
    });
  }
  if (protocol === "http:" && rest.length > 3) {
    res.status(422);
    return res.json({
      errors: [
        "acceptable URL format: http://example.com/live/:streamId/:number.ts",
      ],
    });
  }

  if (live !== "live" && live !== "recordings") {
    res.status(404);
    return res.json({ errors: ["ingest url must start with /live/"] });
  }

  let stream = await db.stream.get(streamId);
  if (!stream) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  if (stream.suspended) {
    res.status(403);
    return res.json({ errors: ["stream is suspended"] });
  }

  const user = await db.user.get(stream.userId);
  if (!user) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  if (user.suspended) {
    res.status(403);
    return res.json({ errors: ["user is suspended"] });
  }

  let objectStore: string,
    recordObjectStore: string,
    recordObjectStoreUrl: string;
  if (stream.objectStoreId) {
    const os = await db.objectStore.get(stream.objectStoreId);
    if (!os || os.deleted || os.disabled) {
      res.status(500);
      return res.json({
        errors: [
          `data integity error: object store ${stream.objectStoreId} not found or disabled`,
        ],
      });
    }
    objectStore = os.url;
  }
  const isLive = live === "live";
  if (
    isLive &&
    stream.record &&
    req.config.recordObjectStoreId &&
    !stream.recordObjectStoreId // we used to create sessions without recordObjectStoreId
  ) {
    const ros = await db.objectStore.get(req.config.recordObjectStoreId);
    if (ros && !ros.deleted && !ros.disabled) {
      await db.stream.update(stream.id, {
        recordObjectStoreId: req.config.recordObjectStoreId,
      });
      stream.recordObjectStoreId = req.config.recordObjectStoreId;
      if (stream.parentId) {
        const sessionId = stream.sessionId ?? stream.id;
        await db.session.update(sessionId, {
          recordObjectStoreId: req.config.recordObjectStoreId,
        });
      }
    }
  }
  if (stream.recordObjectStoreId && !req.config.supressRecordInHook) {
    const ros = await db.objectStore.get(stream.recordObjectStoreId);
    if (!ros || ros.deleted || ros.disabled) {
      res.status(500);
      return res.json({
        errors: [
          `data integity error: record object store ${stream.recordObjectStoreId} not found or disabled`,
        ],
      });
    }
    recordObjectStore = ros.url;
    if (ros.publicUrl) {
      recordObjectStoreUrl = ros.publicUrl;
    }
  }

  // Use our parents' playbackId for sharded playback
  let manifestID = streamId;
  if (stream.parentId) {
    const parent = await db.stream.get(stream.parentId);
    manifestID = parent.playbackId;
  }

  const { data: webhooks } = await db.webhook.listSubscribed(
    user.id,
    "stream.detection"
  );
  let detection = undefined;
  if (webhooks.length > 0 || stream.detection) {
    console.warn(
      `Ignoring configured detection webhooks="${webhooks.map(
        (w) => w.id
      )}" for manifestId=${manifestID}`
    );
    // TODO: Validate if these are the best default configs
    // detection = {
    //   freq: 4, // Segment sample rate. Process 1 / freq segments
    //   sampleRate: 10, // Frames sample rate. Process 1 / sampleRate frames of a segment
    //   sceneClassification: [{ name: "soccer" }, { name: "adult" }],
    // };
    // if (stream.detection?.sceneClassification) {
    //   detection.sceneClassification = stream.detection?.sceneClassification;
    // }
    // console.log(`DetectionHookResponse: ${JSON.stringify(detection)}`);
  }

  console.log(
    `StreamHookResponse id=${manifestID} profiles=${JSON.stringify(
      stream.profiles
    )}`
  );

  res.json({
    manifestID,
    streamID: stream.parentId ?? streamId,
    sessionID: streamId,
    presets: stream.presets,
    profiles: stream.profiles,
    objectStore,
    recordObjectStore,
    recordObjectStoreUrl,
    previousSessions: stream.previousSessions,
    detection,
    verificationFreq: req.config.verificationFrequency,
  });
});

app.post(
  "/hook/detection",
  authorizer({ anyAdmin: true }),
  validatePost("detection-webhook-payload"),
  async (req, res) => {
    const { manifestID, seqNo, sceneClassification }: DetectionWebhookPayload =
      req.body;
    const stream = await db.stream.getByIdOrPlaybackId(manifestID);
    if (!stream) {
      return res.status(404).json({ errors: ["stream not found"] });
    }
    console.log(`DetectionWebhookPayload: ${JSON.stringify(req.body)}`);

    const msg: messages.WebhookEvent = {
      type: "webhook_event",
      id: uuid(),
      timestamp: Date.now(),
      streamId: stream.id,
      event: "stream.detection",
      userId: stream.userId,
      payload: {
        seqNo,
        sceneClassification,
      },
    };

    await req.queue.publishWebhook("events.stream.detection", msg);
    return res.status(204).end();
  }
);

const statsFields: (keyof StreamStats)[] = [
  "sourceBytes",
  "transcodedBytes",
  "sourceSegments",
  "transcodedSegments",
  "sourceSegmentsDuration",
  "transcodedSegmentsDuration",
];

export function getCombinedStats(stream1: StreamStats, stream2: StreamStats) {
  const res: StreamStats = {};
  for (const fn of statsFields) {
    res[fn] = (stream1[fn] || 0) + (stream2[fn] || 0);
  }
  return res;
}

export default app;
