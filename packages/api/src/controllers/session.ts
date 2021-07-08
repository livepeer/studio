import { Router } from "express";
import sql from "sql-template-strings";

import { authMiddleware } from "../middleware";
import { User } from "../schema/types";
import { db } from "../store";
import { DBSession } from "../store/db";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
import { makeNextHREF, parseFilters, parseOrder } from "./helpers";
import {
  USER_SESSION_TIMEOUT,
  getCombinedStats,
  getRecordingUrl,
} from "./stream";

const app = Router();

const fieldsMap = {
  id: `session.ID`,
  name: `session.data->>'name'`,
  lastSeen: { val: `session.data->'lastSeen'`, type: "int" },
  createdAt: { val: `session.data->'createdAt'`, type: "int" },
  userId: `session.data->>'userId'`,
  "user.email": `users.data->>'email'`,
  parentId: `session.data->>'parentId'`,
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

function toStringValues(obj: Record<string, any>) {
  const strObj: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    strObj[key] = value.toString();
  }
  return strObj;
}

app.get("/", authMiddleware({}), async (req, res, next) => {
  let { limit, cursor, all, order, filters, userId, parentId, count } =
    toStringValues(req.query);
  const { forceUrl } = req.query;
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  if (!req.user.admin) {
    userId = req.user.id;
  }
  const query = parseFilters(fieldsMap, filters);
  if (!all || all === "false" || !req.user.admin) {
    query.push(sql`(session.data->>'deleted')::boolean IS false`);
  }
  if (userId) {
    query.push(sql`session.data->>'userId' = ${userId}`);
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
  const olderThen = Date.now() - USER_SESSION_TIMEOUT;
  output.forEach((session) => {
    if (session.record && session.recordObjectStoreId) {
      const isReady = session.lastSeen > 0 && session.lastSeen < olderThen;
      session.recordingStatus = isReady ? "ready" : "waiting";
      if (isReady || (req.user.admin && forceUrl)) {
        session.recordingUrl = getRecordingUrl(ingest, session);
        session.mp4Url = getRecordingUrl(ingest, session, true);
      }
    }
  });
  const sessions = req.user.admin
    ? output
    : removePrivateFieldsMany(output, req.user.admin);
  res.json(sessions);
});

app.get(
  "/migrate2",
  authMiddleware({ anyAdmin: true }),
  async (req, res, next) => {
    const query = [];
    query.push(sql`data->>'record' = 'true'`);
    query.push(sql`data->>'recordObjectStoreId' IS NOT NULL`);

    let docs, cursor;
    const now = Date.now();
    const toClean = [];
    res.writeHead(200);
    res.flushHeaders();
    let processed = 0;
    do {
      [docs, cursor] = await db.session.find(query, { cursor, limit: 100 });
      // sending progress should prevent request timing out
      res.write(".");
      for (const session of docs) {
        if (!session.lastSessionId) {
          const stream = await db.stream.get(session.id);
          if (stream && stream.lastSessionId) {
            await db.session.update(session.id, {
              lastSessionId: stream.lastSessionId,
            });
          }
        }
        processed++;
      }
    } while (cursor);
    res.write("\n");
    res.end(`processed ${processed} sessions\n`);
  }
);

app.get(
  "/migrate",
  authMiddleware({ anyAdmin: true }),
  async (req, res, next) => {
    const query = [];
    query.push(sql`data->>'record' = 'true'`);
    query.push(sql`data->>'recordObjectStoreId' IS NOT NULL`);
    query.push(sql`data->'parentId' is not null `);
    query.push(sql`(data->'lastSeen')::bigint > 0`);
    query.push(sql`(data->'sourceSegmentsDuration')::bigint > 0`);
    query.push(sql`data->>'partialSession' IS NULL`);

    let docs, cursor;
    const now = Date.now();
    const toClean = [];
    res.writeHead(200);
    res.flushHeaders();
    let processed = 0;
    const olderThen = Date.now() - USER_SESSION_TIMEOUT;
    do {
      [docs, cursor] = await db.stream.find(query, { cursor, limit: 100 });
      // sending progress should prevent request timing out
      res.write(".");
      for (const stream of docs) {
        const isReady = stream.lastSeen > 0 && stream.lastSeen < olderThen;
        if (!isReady) {
          continue;
        }
        let sessionId = stream.id;
        if (stream.previousSessions && stream.previousSessions.length) {
          sessionId = stream.previousSessions[0];
        }
        const sessObj = await db.session.get(sessionId);
        if (sessObj) {
          continue;
        }
        const parent = await db.stream.get(stream.parentId);
        const combinedStats = getCombinedStats(
          stream,
          stream.previousStats || {}
        );
        const newSession: DBSession & DBStream = {
          ...stream,
          ...combinedStats,
          createdAt: stream.userSessionCreatedAt || stream.createdAt,
          id: sessionId,
          deleted: false,
          isActive: undefined,
          previousStats: undefined,
          previousSessions: undefined,
          userSessionCreatedAt: undefined,
          renditions: undefined,
          kind: "session",
          playbackId: parent.playbackId,
        };
        await db.session.create(newSession);
        processed++;
      }
    } while (cursor);
    res.write("\n");
    res.end(`processed ${processed} sessions\n`);
  }
);

app.get("/:id", authMiddleware({}), async (req, res) => {
  let session = await db.session.get(req.params.id);
  if (
    !session ||
    ((session.userId !== req.user.id || session.deleted) && !req.user.admin)
  ) {
    // do not reveal that session exists
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  res.status(200);
  const ingests = await req.getIngest();
  const ingest = ingests && ingests.length ? ingests[0].base : "";
  const olderThen = Date.now() - USER_SESSION_TIMEOUT;
  if (session.record && session.recordObjectStoreId) {
    const isReady = session.lastSeen > 0 && session.lastSeen < olderThen;
    session.recordingStatus = isReady ? "ready" : "waiting";
    if (isReady) {
      session.recordingUrl = getRecordingUrl(ingest, session);
      session.mp4Url = getRecordingUrl(ingest, session, true);
    }
  }
  if (!req.user.admin) {
    removePrivateFields(session, req.user.admin);
  }
  res.json(session);
});

function removePrivateFields(obj: DBSession, isAdmin = false) {
  for (const fn of privateFields) {
    delete obj[fn];
  }
  if (!isAdmin) {
    for (const fn of adminOnlyFields) {
      delete obj[fn];
    }
  }
  return obj;
}

function removePrivateFieldsMany(objs: DBSession[], isAdmin = false) {
  return objs.map((o) => removePrivateFields(o, isAdmin));
}

const adminOnlyFields: (keyof DBSession)[] = ["deleted", "broadcasterHost"];

const privateFields: (keyof DBSession)[] = ["recordObjectStoreId"];

export default app;
