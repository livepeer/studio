import { SQLStatement } from "sql-template-strings";
import mung from "express-mung";

import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Response, Router } from "express";
import { makeNextHREF, parseFilters, parseOrder } from "./helpers";
import { db } from "../store";
import { FindOptions, FindQuery, WithID } from "../store/types";
import { Clip } from "../schema/types";
import { v4 as uuid } from "uuid";

const fieldsMap = {
  id: `clip.ID`,
  name: `clip.data->>'name'`,
  url: `clip.data->>'url'`,
  createdAt: { val: `clip.data->'createdAt'`, type: "int" },
  userId: `clip.data->>'userId'`,
  "user.email": `users.data->>'email'`,
};

function adminListQuery(
  limit: number,
  cursor: string,
  orderStr: string,
  filters: string
): [SQLStatement[], FindOptions] {
  const fields =
    " clip.id as id, clip.data as data, users.id as usersId, users.data as usersData";
  const from = `clip left join users on clip.data->>'userId' = users.id`;
  const order = parseOrder(fieldsMap, orderStr);
  const process = ({ data, usersData }) => {
    return { ...data, user: db.user.cleanWriteOnlyResponse(usersData) };
  };

  const query = parseFilters(fieldsMap, filters);
  const opts = { limit, cursor, fields, from, order, process };
  return [query, opts];
}

function toStringValues(obj: Record<string, any>): Record<string, string> {
  const strObj = {};
  for (const [key, value] of Object.entries(obj)) {
    strObj[key] = value.toString();
  }
  return strObj;
}

function respondError(res: Response, status: number, error: string) {
  return res.status(status).json({
    errors: [error],
  });
}

const notFound = (res: Response) => respondError(res, 404, "not found");

const forbidden = (res: Response) =>
  respondError(res, 403, "users can only access their own clips");

const badRequest = (res: Response, error: string) =>
  respondError(res, 400, error);

const app = Router();

app.use(authMiddleware({}));

app.use(
  mung.json(function cleanWriteOnlyResponses(data, req) {
    if (req.user.admin) {
      return data;
    }
    if (Array.isArray(data)) {
      return db.clip.cleanWriteOnlyResponses(data);
    }
    if ("id" in data) {
      return db.clip.cleanWriteOnlyResponse(data as WithID<Clip>);
    }
    return data;
  })
);

app.get("/", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const qs = toStringValues(req.query);
  const { limit: limitStr, cursor, userId, order, filters } = qs;
  let limit = parseInt(limitStr);
  if (isNaN(limit)) {
    limit = undefined;
  }

  let query: FindQuery | Array<SQLStatement>;
  let opts: FindOptions;
  if (!userId) {
    if (!isAdmin) {
      return badRequest(res, "required query parameter: userId");
    }
    [query, opts] = adminListQuery(limit, cursor, order, filters);
  } else {
    if (!isAdmin && req.user.id !== userId) {
      return forbidden(res);
    }
    [query, opts] = [{ userId }, { limit, cursor }];
  }
  const [output, newCursor] = await db.clip.find(query, opts);

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(output);
});

app.get("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const data = await db.clip.get(req.params.id);
  if (!data || (data.userId !== req.user.id && !isAdmin)) {
    return notFound(res);
  }
  res.json(data);
});

app.post("/", validatePost("clip"), async (req, res) => {
  const input = req.body as Clip;
  const parent = await db.stream.get(input.parentId);
  if (!parent || parent.userId !== req.user.id) {
    return notFound(res);
  }
  const data = await db.clip.create({
    id: uuid(),
    kind: "clip",
    userId: req.user.id,
    parentId: input.parentId,
    profiles: input.profiles,
    createdAt: Date.now(),
    recordingStatus: "waiting",
  });
  res.status(201);
  res.json(data);
});

app.delete("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const { id } = req.params;
  const clip = await db.clip.get(req.params.id);
  if (!clip || (clip.userId !== req.user.id && !isAdmin)) {
    return notFound(res);
  }
  await db.clip.delete(id);

  res.status(204);
  res.end();
});

export default app;
