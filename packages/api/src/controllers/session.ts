import { Router } from "express";
import sql from "sql-template-strings";

import { authorizer } from "../middleware";
import { User } from "../schema/types";
import { db } from "../store";
import { DBSession } from "../store/db";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
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

const app = Router();

const fieldsMap: FieldsMap = {
  id: `session.ID`,
  name: { val: `session.data->>'name'`, type: "full-text" },
  lastSeen: { val: `session.data->'lastSeen'`, type: "int" },
  createdAt: { val: `session.data->'createdAt'`, type: "int" },
  userId: `session.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
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

app.get("/", authorizer({}), async (req, res, next) => {
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
  let sessions = await Promise.all(
    output.map(async (session) =>
      toExternalSession(session, ingest, !!forceUrl, req.user.admin)
    )
  );
  res.json(sessions);
});

app.get("/:id", authorizer({}), async (req, res) => {
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
  session = await toExternalSession(session, ingest, false, req.user.admin);
  res.json(session);
});

export async function toExternalSession(
  obj: DBSession,
  ingest: string,
  forceUrl = false,
  isAdmin = false
) {
  obj = await withRecordingFields(ingest, obj, forceUrl);
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

const privateFields: (keyof DBSession)[] = ["recordObjectStoreId"];

export default app;
