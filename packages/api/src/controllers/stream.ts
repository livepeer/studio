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
import {
  DetectionWebhookPayload,
  StreamPatchPayload,
  StreamSetActivePayload,
  User,
} from "../schema/types";
import { db } from "../store";
import { DBSession } from "../store/db";
import { BadRequestError } from "../store/errors";
import { DBStream, StreamStats } from "../store/stream-table";
import { WithID } from "../store/types";
import { IStore } from "../types/common";
import messages from "../store/messages";
import { getBroadcasterHandler } from "./broadcaster";
import { generateStreamKey } from "./generate-stream-key";
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

type Profile = DBStream["profiles"][number];
type MultistreamOptions = DBStream["multistream"];
type MultistreamTargetRef = MultistreamOptions["targets"][number];

export const USER_SESSION_TIMEOUT = 60 * 1000; // 1 min
const HTTP_PUSH_TIMEOUT = 60 * 1000; // value in the go-livepeer codebase
const ACTIVE_TIMEOUT = 90 * 1000;

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

export function getRecordingUrl(
  ingest: string,
  session: DBSession,
  mp4 = false
) {
  return pathJoin(
    ingest,
    `recordings`,
    session.lastSessionId ? session.lastSessionId : session.id,
    mp4 ? `source.mp4` : `index.m3u8`
  ) as string;
}

function isActuallyNotActive(stream: DBStream) {
  return (
    stream.isActive &&
    !isNaN(stream.lastSeen) &&
    Date.now() - stream.lastSeen > ACTIVE_TIMEOUT
  );
}

function activeCleanupOne(stream: DBStream) {
  if (isActuallyNotActive(stream)) {
    db.stream.setActiveToFalse(stream);
    stream.isActive = false;
    return true;
  }
  return false;
}

function activeCleanup(streams: DBStream[], activeOnly = false) {
  let hasStreamsToClean: boolean;
  for (const stream of streams) {
    hasStreamsToClean = activeCleanupOne(stream);
  }
  if (activeOnly && hasStreamsToClean) {
    return streams.filter((s) => !isActuallyNotActive(s));
  }
  return streams;
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

  res.status(200);

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(
    activeCleanup(
      db.stream.addDefaultFieldsMany(
        db.stream.removePrivateFieldsMany(output, req.user.admin)
      ),
      !!active
    )
  );
});

function setRecordingStatus(
  req: Request,
  ingest: string,
  session: DBSession,
  forceUrl: boolean
) {
  const olderThen = Date.now() - USER_SESSION_TIMEOUT;
  if (session.record && session.recordObjectStoreId && session.lastSeen > 0) {
    const isReady = session.lastSeen > 0 && session.lastSeen < olderThen;
    session.recordingStatus = isReady ? "ready" : "waiting";
    if (isReady || forceUrl) {
      session.recordingUrl = getRecordingUrl(ingest, session);
      session.mp4Url = getRecordingUrl(ingest, session, true);
    }
  }
}

// returns only 'user' sessions and adds
app.get("/:parentId/sessions", authorizer({}), async (req, res) => {
  const { parentId } = req.params;
  const { record, forceUrl } = req.query;
  let { limit, cursor } = toStringValues(req.query);
  const raw = req.query.raw && req.user.admin;

  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }
  const ingest = ingests[0].base;

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

  let [sessions] = await db.stream.find(query, {
    order: `data->'lastSeen' DESC NULLS LAST`,
    limit,
    cursor,
  });

  const olderThen = Date.now() - USER_SESSION_TIMEOUT;
  sessions = sessions.map((session) => {
    setRecordingStatus(req, ingest, session, !!forceUrl);
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
  });
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

  res.status(200);

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(
    activeCleanup(
      db.stream.addDefaultFieldsMany(
        db.stream.removePrivateFieldsMany(streams, req.user.admin)
      )
    )
  );
});

app.get("/:id", authorizer({}), async (req, res) => {
  const raw = req.query.raw && req.user.admin;
  let stream = await db.stream.get(req.params.id);
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.isUIAdmin)
  ) {
    // do not reveal that stream exists
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  activeCleanupOne(stream);
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
  if (stream.record) {
    const ingests = await req.getIngest();
    if (ingests.length) {
      const ingest = ingests[0].base;
      setRecordingStatus(req, ingest, stream, false);
    }
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

async function generateUniqueStreamKey(store: IStore, otherKeys: string[]) {
  while (true) {
    const streamKey: string = await generateStreamKey();
    const qres = await store.query({
      kind: "stream",
      query: { streamKey },
    });
    if (!qres.data.length && !otherKeys.includes(streamKey)) {
      return streamKey;
    }
  }
}

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

    // The first four letters of our playback id are the shard key.
    const id = stream.playbackId.slice(0, 4) + uuid().slice(4);
    const createdAt = Date.now();

    let previousSessions: string[],
      previousStats: StreamStats,
      userSessionCreatedAt: number;
    let firstSession = true;
    if (stream.record && req.config.recordObjectStoreId) {
      // find previous sessions to form 'user' session
      const tooOld = createdAt - USER_SESSION_TIMEOUT;
      const query = [];
      query.push(sql`data->>'parentId' = ${stream.id}`);
      query.push(
        sql`((data->'lastSeen')::bigint > ${tooOld} OR  (data->'createdAt')::bigint > ${tooOld})`
      );

      const [prevSessionsDocs] = await db.stream.find(query, {
        order: `data->'lastSeen' DESC, data->'createdAt' DESC `,
      });
      if (
        prevSessionsDocs.length &&
        prevSessionsDocs[0].recordObjectStoreId ==
          req.config.recordObjectStoreId
      ) {
        const latestSession = prevSessionsDocs[0];
        userSessionCreatedAt =
          latestSession.userSessionCreatedAt || latestSession.createdAt;
        previousSessions = latestSession.previousSessions;
        if (!Array.isArray(previousSessions)) {
          previousSessions = [];
        }
        previousSessions.push(latestSession.id);
        previousStats = getCombinedStats(
          latestSession,
          latestSession.previousStats || {}
        );
        firstSession = false;
        setImmediate(() => {
          db.session
            .update(previousSessions[0], {
              lastSessionId: id,
            })
            .catch((e) => {
              logger.error(e);
            });
        });
        setImmediate(() => {
          db.stream
            .update(previousSessions[0], {
              lastSessionId: id,
            })
            .catch((e) => {
              logger.error(e);
            });
        });
        setImmediate(() => {
          db.stream
            .update(latestSession.id, {
              partialSession: true,
            })
            .catch((e) => {
              logger.error(e);
            });
        });
      }
    }

    let region;
    if (req.config.ownRegion) {
      region = req.config.ownRegion;
    }

    const doc: DBStream = wowzaHydrate({
      ...req.body,
      kind: "stream",
      userId: stream.userId,
      renditions: {},
      objectStoreId: stream.objectStoreId,
      recordObjectStoreId: stream.recordObjectStoreId,
      record: stream.record,
      id,
      createdAt,
      parentId: stream.id,
      previousSessions,
      previousStats,
      userSessionCreatedAt,
      region,
      lastSeen: 0,
      isActive: false,
    });

    doc.profiles = hackMistSettings(
      req,
      useParentProfiles ? stream.profiles : doc.profiles
    );

    if (firstSession) {
      // create 'session' object in 'session table
      const session: DBSession = {
        id,
        parentId: stream.id,
        playbackId: stream.playbackId,
        userId: stream.userId,
        kind: "session",
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
        recordObjectStoreId: stream.recordObjectStoreId,
        record: stream.record,
        profiles: doc.profiles,
      };
      if (session.record) {
        session.recordingStatus = "waiting";
        session.recordingUrl = "";
        session.mp4Url = "";
      }
      await db.session.create(session);
    }

    try {
      await req.store.create(doc);
    } catch (e) {
      console.error(e);
      throw e;
    }

    res.status(201);
    res.json(db.stream.removePrivateFields(doc, req.user.admin));
    logger.info(
      `stream session created for stream_id=${stream.id} stream_name='${
        stream.name
      }' playbackid=${stream.playbackId} session_id=${id} elapsed=${
        Date.now() - start
      }ms`
    );
  }
);

app.post("/", authorizer({}), validatePost("stream"), async (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(422);
    return res.json({
      errors: ["missing name"],
    });
  }
  const id = uuid();
  const createdAt = Date.now();
  let streamKey = await generateUniqueStreamKey(req.store, []);
  // Mist doesn't allow dashes in the URLs
  let playbackId = (
    await generateUniqueStreamKey(req.store, [streamKey])
  ).replace(/-/g, "");

  // use the first four characters of the id as the "shard key" across all identifiers
  const shardKey = id.slice(0, 4);
  streamKey = shardKey + streamKey.slice(4);
  playbackId = shardKey + playbackId.slice(4);

  let objectStoreId;
  if (req.body.objectStoreId) {
    const store = await db.objectStore.get(req.body.objectStoreId);
    if (!store) {
      res.status(400);
      return res.json({
        errors: [`object-store ${req.body.objectStoreId} does not exist`],
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

    const ingest = ((await req.getIngest()) ?? [])[0]?.base;
    sendSetActiveHooks(stream, req.body, req.queue, ingest).catch((err) => {
      logger.error("Error sending /setactive hooks err=", err);
    });

    const sameFromStream =
      stream.region === req.config.ownRegion && stream.mistHost === hostName;
    if (stream.isActive && !active && !sameFromStream) {
      // This likely means the user is doing multiple sessions with the same
      // stream key. We only support 1 conc. session so ignore previous ones.
      logger.info(
        `Ignoring /setactive false since another session had already started. ` +
          `stream=${id} currMist="${stream.region}-${stream.mistHost}" oldMist="${req.config.ownRegion}-${hostName}"`
      );
      return res.status(204).end();
    }

    const patch = {
      isActive: active,
      lastSeen: Date.now(),
      mistHost: hostName,
      region: req.config.ownRegion,
    };
    await db.stream.update(stream.id, patch);
    // update the other auxiliary info in the database in background.
    setImmediate(async () => {
      try {
        if (active) {
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

const sendSetActiveHooks = async (
  stream: DBStream,
  { active, startedAt }: StreamSetActivePayload,
  queue: Queue,
  ingest: string
) => {
  // trigger the webhooks, reference https://github.com/livepeer/livepeerjs/issues/791#issuecomment-658424388
  // this could be used instead of /webhook/:id/trigger (althoughs /trigger requires admin access )
  const event = active ? "stream.started" : "stream.idle";
  await queue.publishWebhook(`events.${event}`, {
    type: "webhook_event",
    id: uuid(),
    timestamp: Date.now(),
    streamId: stream.id,
    event: event,
    userId: stream.userId,
  });

  if (!active && stream.record === true) {
    // emit recording.ready
    // find last session
    const session = await db.stream.getLastSession(stream.id);
    if (session) {
      if (
        (session.lastSeen ?? 0) <
        (startedAt ?? Date.now() - USER_SESSION_TIMEOUT)
      ) {
        // last session is too old, probably transcoding wasn't happening, and so there
        // will be no recording
      } else {
        const recordingUrl = getRecordingUrl(ingest, session);
        const mp4Url = getRecordingUrl(ingest, session, true);
        await queue.delayedPublishWebhook(
          "events.recording.ready",
          {
            type: "webhook_event",
            id: uuid(),
            timestamp: Date.now(),
            streamId: stream.id,
            event: "recording.ready",
            userId: stream.userId,
            sessionId: session.id,
            payload: {
              recordingUrl,
              mp4Url,
            },
          },
          USER_SESSION_TIMEOUT + HTTP_PUSH_TIMEOUT
        );
      }
    }
  }
  if (active && stream.record === true) {
    let shouldEmit = true;
    const session = await db.stream.getLastSession(stream.id);
    if (session) {
      const timeSinceSeen = Date.now() - (session.lastSeen ?? 0);
      if (timeSinceSeen < USER_SESSION_TIMEOUT) {
        // there is recent session exits, so new one will be joined with last one
        // not emitting "recording.started" because it will be same recorded session
        shouldEmit = false;
      }
    }
    if (shouldEmit) {
      await queue.publishWebhook("events.recording.started", {
        type: "webhook_event",
        id: uuid(),
        timestamp: Date.now(),
        streamId: stream.id,
        event: "recording.started",
        userId: stream.userId,
      });
    }
  }
};

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

    let { record, suspended, multistream } = payload;
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
    (stream.userId !== req.user.id && !req.isUIAdmin)
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
  activeCleanupOne(stream);
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

    const regionalUrl = `${protocol}://${stream.region}.${req.frontendDomain}/api/stream/${stream.id}/terminate`;
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
    if (!os) {
      res.status(500);
      return res.json({
        errors: [
          `data integity error: object store ${stream.objectStoreId} not found`,
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
    !stream.recordObjectStoreId
  ) {
    const ros = await db.objectStore.get(req.config.recordObjectStoreId);
    if (ros && !ros.disabled) {
      await db.stream.update(stream.id, {
        recordObjectStoreId: req.config.recordObjectStoreId,
      });
      stream.recordObjectStoreId = req.config.recordObjectStoreId;
      if (stream.parentId && !stream.previousSessions) {
        await db.session.update(stream.id, {
          recordObjectStoreId: req.config.recordObjectStoreId,
        });
      }
    }
  }
  if (stream.recordObjectStoreId && !req.config.supressRecordInHook) {
    const ros = await db.objectStore.get(stream.recordObjectStoreId);
    if (!ros) {
      res.status(500);
      return res.json({
        errors: [
          `data integity error: record object store ${stream.recordObjectStoreId} not found`,
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
