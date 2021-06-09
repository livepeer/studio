import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { makeNextHREF, parseFilters, parseOrder } from "./helpers";
import { v4 as uuid } from "uuid";
import { db } from "../store";
import { FindOptions, FindQuery } from "../store/types";
import { SQLStatement } from "sql-template-strings";

const fieldsMap = {
  id: `push_target.ID`,
  name: `push_target.data->>'name'`,
  url: `push_target.data->>'url'`,
  disabled: { val: `push_target.data->'disabled'`, type: "boolean" },
  createdAt: { val: `push_target.data->'createdAt'`, type: "int" },
  userId: `push_target.data->>'userId'`,
  "user.email": `users.data->>'email'`,
};

function toStringValues(obj: Record<string, any>): Record<string, string> {
  const strObj = {};
  for (const [key, value] of Object.entries(obj)) {
    strObj[key] = value.toString();
  }
  return strObj;
}

function adminListQuery(
  limit: number,
  cursor: string,
  orderStr: string,
  filters: string
): [SQLStatement[], FindOptions] {
  const fields =
    " push_target.id as id, push_target.data as data, users.id as usersId, users.data as usersData";
  const from = `push_target left join users on push_target.data->>'userId' = users.id`;
  const order = parseOrder(fieldsMap, orderStr);
  const process = ({ data, usersData }) => {
    return { ...data, user: db.user.cleanWriteOnlyResponse(usersData) };
  };

  const query = parseFilters(fieldsMap, filters);
  const opts = { limit, cursor, fields, from, order, process };
  return [query, opts];
}

const app = Router();

app.use(function cleanWriteOnlyResponses(req, res, next) {
  if (req.user.admin) return next();

  const origResJson = res.json;
  res.json = (data) => {
    data = Array.isArray(data)
      ? db.pushTarget.cleanWriteOnlyResponses(data)
      : db.pushTarget.cleanWriteOnlyResponse(data);
    return origResJson(data);
  };
  return next();
});

app.use(authMiddleware({}));

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
      res.status(400);
      return res.json({
        errors: [`required query parameter: userId`],
      });
    }
    [query, opts] = adminListQuery(limit, cursor, order, filters);
  } else {
    if (!isAdmin && req.user.id !== userId) {
      res.status(403);
      return res.json({
        errors: ["users can only access their own push targets"],
      });
    }
    [query, opts] = [{ userId }, { limit, cursor }];
  }
  const [output, newCursor] = await db.pushTarget.find(query, opts);

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(output);
});

app.get("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const data = await db.pushTarget.get(req.params.id);
  if (!data) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!isAdmin && req.user.id !== data.userId) {
    res.status(403);
    return res.json({
      errors: ["users can only access their own push targets"],
    });
  }
  res.json(data);
});

app.post("/", validatePost("push-target"), async (req, res) => {
  const id = uuid();
  await db.pushTarget.create({
    id,
    name: req.body.name,
    url: req.body.url,
    disabled: req.body.disabled,
    userId: req.user.id,
    createdAt: Date.now(),
  });

  const data = await db.pushTarget.get(id, { useReplica: false });
  if (!data) {
    res.status(500);
    return res.json({ errors: ["push target not created"] });
  }
  res.status(201);
  res.json(data);
});

app.delete("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const { id } = req.params;
  const data = await db.objectStore.get(id);
  if (!data) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!isAdmin && req.user.id !== data.userId) {
    res.status(403);
    return res.json({
      errors: ["users can only access their own push targets"],
    });
  }
  await db.objectStore.delete(id);

  res.status(204);
  res.end();
});

app.patch("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const { id } = req.params;
  const data = await db.pushTarget.get(id);
  if (!data) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!isAdmin && req.user.id !== data.userId) {
    res.status(403);
    return res.json({
      errors: ["users can only access their own push targets"],
    });
  }
  const disabledPatch = req.body.disabled;
  if (typeof disabledPatch !== "boolean") {
    res.status(400);
    return res.json({
      errors: ["required boolean field in payload: disabled"],
    });
  }
  await db.pushTarget.update(id, { disabled: !!req.body.disabled });
  res.status(204);
  res.end();
});

export default app;
