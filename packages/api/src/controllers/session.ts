import { Router, Request } from "express";
import sql from "sql-template-strings";

import { authorizer, hasAccessToResource } from "../middleware";
import { User, Project } from "../schema/types";
import { db } from "../store";
import { DBSession } from "../store/session-table";
import { addDefaultProjectId, pathJoin } from "../controllers/helpers";
import { fetchWithTimeout } from "../util";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
import { CliArgs } from "../parse-cli";
import {
  FieldsMap,
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import {
  USER_SESSION_TIMEOUT,
  getCombinedStats,
  withRecordingFields,
} from "./stream";
import { LVPR_SDK_EMAILS, getClips } from "./clip";
import { NotFoundError } from "../store/errors";
import { cache } from "../store/cache";
import mung from "express-mung";

const app = Router();

const fieldsMap: FieldsMap = {
  id: `session.ID`,
  name: { val: `session.data->>'name'`, type: "full-text" },
  lastSeen: { val: `session.data->'lastSeen'`, type: "int" },
  createdAt: { val: `session.data->'createdAt'`, type: "int" },
  userId: `session.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  parentId: `session.data->>'parentId'`,
  projectId: `session.data->>'projectId'`,
  record: { val: `session.data->'record'`, type: "boolean" },
  sourceSegments: `session.data->'sourceSegments'`,
  transcodedSegments: {
    val: `session.data->'transcodedSegments'`,
    type: "int",
  },
  sourceSegmentsDuration: {
    val: `session.data->'sourceSegmentsDuration'`,
    type: "real",
  },
  transcodedSegmentsDuration: {
    val: `session.data->'transcodedSegmentsDuration'`,
    type: "real",
  },
  sourceBytes: { val: `session.data->'sourceBytes'`, type: "int" },
  transcodedBytes: { val: `session.data->'transcodedBytes'`, type: "int" },
  ingestRate: { val: `session.data->'ingestRate'`, type: "real" },
  outgoingRate: { val: `session.data->'outgoingRate'`, type: "real" },
  recordingStatus: `session.data->'recordingStatus'`,
};

app.use(mung.jsonAsync(addDefaultProjectId));

app.get("/", authorizer({}), async (req, res, next) => {
  let { limit, cursor, all, order, filters, userId, parentId, count } =
    toStringValues(req.query);
  const { forceUrl } = req.query;
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  const query = parseFilters(fieldsMap, filters);

  if (!req.user.admin) {
    userId = req.user.id;
  }
  if (!all || all === "false" || !req.user.admin) {
    query.push(sql`(session.data->>'deleted')::boolean IS false`);
  }
  if (userId) {
    query.push(sql`session.data->>'userId' = ${userId}`);
    if (userId === req.user.id) {
      query.push(
        sql`coalesce(session.data->>'projectId', ${
          req.user.defaultProjectId || ""
        }) = ${req.project?.id || ""}`,
      );
    }
  }
  if (parentId) {
    query.push(sql`session.data->>'parentId' = ${parentId}`);
  }

  if (!order) {
    order = "lastSeen-true,createdAt-true";
  }
  order = parseOrder(fieldsMap, order);

  type ResultRow = {
    id: string;
    data: DBSession;
    stream: DBStream;
    usersId: string;
    usersdata: WithID<User>;
    count?: number;
  };
  let fields =
    "session.id as id, session.data as data, users.id as usersId, users.data as usersdata, stream.data as stream";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `session left join users on session.data->>'userId' = users.id
  left join stream on session.data->>'parentId' = stream.id`;
  const [output, newCursor] = await db.session.find(query, {
    limit,
    cursor,
    fields,
    from,
    order,
    process: ({ data, usersdata, stream, count: c }: ResultRow) => {
      if (count) {
        res.set("X-Total-Count", c.toString());
      }
      return req.user.admin
        ? {
            ...data,
            parentStream: stream,
            user: db.user.cleanWriteOnlyResponse(usersdata),
          }
        : {
            ...data,
            parentStream: stream,
          };
    },
  });

  res.status(200);

  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }
  const ingest = ingests[0].base;

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  let sessions = await Promise.all(
    output.map(async (session) =>
      toExternalSession(
        req.config,
        session,
        ingest,
        !!forceUrl,
        req.user.admin,
      ),
    ),
  );
  res.json(sessions);
});

app.get("/:id", authorizer({}), async (req, res) => {
  let session = await db.session.get(req.params.id);
  if (
    !session ||
    (!hasAccessToResource(req, session) &&
      !LVPR_SDK_EMAILS.includes(req.user.email))
  ) {
    // do not reveal that session exists
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  res.status(200);

  let originalRecordingUrl: string | null = null;

  if (req.query.sourceRecording === "true") {
    const { url } = await buildRecordingUrl(
      session,
      req.config.recordCatalystObjectStoreId,
      req.config.secondaryRecordObjectStoreId,
    );
    originalRecordingUrl = url;
    session.sourceRecordingUrl = originalRecordingUrl;
  }

  const ingests = await req.getIngest();
  const ingest = ingests && ingests.length ? ingests[0].base : "";
  session = await toExternalSession(
    req.config,
    session,
    ingest,
    false,
    req.user.admin,
  );

  res.json(session);
});

app.get("/:id/clips", authorizer({}), async (req, res) => {
  const id = req.params.id;

  const session = await db.session.get(id);

  if (!session) {
    throw new NotFoundError("Session not found");
  }

  let response = await getClips(session, req, res);
  return response;
});

export async function toExternalSession(
  config: CliArgs,
  obj: DBSession,
  ingest: string,
  forceUrl = false,
  isAdmin = false,
): Promise<DBSession> {
  obj = await withRecordingFields(config, ingest, obj, forceUrl);
  if (!isAdmin) {
    removePrivateFields(obj);
  }
  return obj;
}

function removePrivateFields(obj: DBSession) {
  for (const fn of privateFields) {
    delete obj[fn];
  }
  for (const fn of adminOnlyFields) {
    delete obj[fn];
  }
}

const adminOnlyFields: (keyof DBSession)[] = ["deleted", "broadcasterHost"];

const privateFields: (keyof DBSession)[] = ["recordObjectStoreId", "version"];

export async function getRunningRecording(content: DBStream, req: Request) {
  const session = await db.session.getLastSession(content.id);

  if (!session) {
    console.log(`
      session: get last running session: no sessions found for stream ${content.id}
    `);
    return {
      url: null,
      thumbUrl: null,
      session: null,
      objectStoreId: null,
    };
  }

  return await buildRecordingUrl(
    session,
    req.config.recordCatalystObjectStoreId,
    req.config.secondaryRecordObjectStoreId,
  );
}

export async function buildRecordingUrl(
  session: DBSession,
  recordCatalystObjectStoreId: string,
  secondaryRecordObjectStoreId: string,
) {
  return (
    (await buildSingleRecordingUrl(session, recordCatalystObjectStoreId)) ??
    (await buildSingleRecordingUrl(session, secondaryRecordObjectStoreId)) ?? {
      url: null,
      thumbUrl: null,
      session,
      objectStoreId: secondaryRecordObjectStoreId,
    }
  );
}

async function buildSingleRecordingUrl(
  session: DBSession,
  objectStoreId: string,
) {
  const os = await db.objectStore.get(objectStoreId, { useCache: true });

  const urlPrefix = pathJoin(os.publicUrl, session.playbackId, session.id);
  const manifestUrl = pathJoin(urlPrefix, "output.m3u8");

  const cacheKey = `manifest-check-${manifestUrl}`;
  let exists = cache.get<boolean>(cacheKey);
  if (typeof exists === "undefined") {
    const resp = await fetchWithTimeout(manifestUrl, {
      method: "HEAD",
      timeout: 5 * 1000,
    });
    exists = resp.status === 200;

    // cache only for 15 seconds if it doesn't exist, in case stream is starting
    const ttl = exists ? 120 : 15;
    cache.set(cacheKey, exists, ttl);
  }

  if (!exists) {
    return null;
  }

  return {
    url: manifestUrl,
    session,
    objectStoreId,
    thumbUrl: pathJoin(urlPrefix, "source", "latest.jpg"),
  };
}

export default app;
