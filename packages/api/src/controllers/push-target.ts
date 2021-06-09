import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { makeNextHREF, parseFilters, parseOrder } from "./helpers";
import { v4 as uuid } from "uuid";
import { db } from "../store";
import { ObjectStore } from "../schema/types";
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

app.get("/", authMiddleware({}), async (req, res) => {
  const qs = toStringValues(req.query);
  const { limit: limitStr, cursor, userId, order, filters } = qs;
  let limit = parseInt(limitStr);
  if (isNaN(limit)) {
    limit = undefined;
  }

  let query: FindQuery | Array<SQLStatement>;
  let opts: FindOptions;
  if (!userId) {
    if (!req.user.admin) {
      res.status(400);
      return res.json({
        errors: [`required query parameter: userId`],
      });
    }
    [query, opts] = adminListQuery(limit, cursor, order, filters);
  } else {
    if (!req.user.admin && req.user.id !== userId) {
      res.status(403);
      return res.json({
        errors: [
          "user can only request information about their own push targets",
        ],
      });
    }
    [query, opts] = [{ userId }, { limit, cursor }];
  }

  let [output, newCursor] = await db.pushTarget.find(query, opts);
  if (!req.user.admin) {
    output = db.pushTarget.cleanWriteOnlyResponses(output);
  }

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(output);
});

app.get("/:id", authMiddleware({}), async (req, res) => {
  const os = await req.store.get<ObjectStore>(`object-store/${req.params.id}`);
  if (!os) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }

  if (req.user.admin !== true && req.user.id !== os.userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own object stores"],
    });
  }

  res.json(os);
});

app.post(
  "/",
  authMiddleware({}),
  validatePost("object-store"),
  async (req, res) => {
    const id = uuid();

    await db.objectStore.create({
      id: id,
      url: req.body.url,
      name: req.body.name,
      publicUrl: req.body.publicUrl,
      userId: req.user.id,
      createdAt: Date.now(),
    });

    const store = await db.objectStore.get(id, { useReplica: false });

    if (store) {
      res.status(201);
      res.json(db.objectStore.cleanWriteOnlyResponse(store));
    } else {
      res.status(403);
      res.json({ errors: ["store not created"] });
    }
  }
);

app.delete("/:id", authMiddleware({}), async (req, res) => {
  const { id } = req.params;
  const objectStore = await db.objectStore.get(id);
  if (!objectStore) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== objectStore.userId) {
    res.status(403);
    return res.json({
      errors: ["users may only delete their own object stores"],
    });
  }
  await db.objectStore.delete(id);
  res.status(204);
  res.end();
});

app.patch("/:id", authMiddleware({}), async (req, res) => {
  const { id } = req.params;
  const objectStore = await db.objectStore.get(id);
  if (!objectStore) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== objectStore.userId) {
    res.status(403);
    return res.json({
      errors: ["users may change only their own object stores"],
    });
  }
  if (req.body.disabled === undefined) {
    res.status(400);
    return res.json({ errors: ["disabled field required"] });
  }
  console.log(`set object store ${id} disabled=${req.body.disabled}`);
  await db.objectStore.update(id, { disabled: !!req.body.disabled });
  res.status(204);
  res.end();
});

export default app;
