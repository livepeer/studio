import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { makeNextHREF, parseFilters, parseOrder } from "./helpers";
import { v4 as uuid } from "uuid";
import { db } from "../store";
import { ObjectStore } from "../schema/types";

const app = Router();

const fieldsMap = {
  id: `object_store.ID`,
  name: `object_store.data->>'name'`,
  url: `object_store.data->>'url'`,
  publicUrl: `object_store.data->>'publicUrl'`,
  disabled: `object_store.data->'disabled'`,
  createdAt: `object_store.data->'createdAt'`,
  userId: `object_store.data->>'userId'`,
  "user.email": `users.data->>'email'`,
};

app.get("/", authMiddleware({}), async (req, res) => {
  let { limit: limitStr, cursor, userId, order, filters } = req.query;
  let limit = parseInt(limitStr.toString());
  if (isNaN(limit)) {
    limit = undefined;
  }

  if (req.user.admin && !userId) {
    const query = parseFilters(fieldsMap, filters);

    const fields =
      " object_store.id as id, object_store.data as data, users.id as usersId, users.data as usersdata";
    const from = `object_store left join users on object_store.data->>'userId' = users.id`;
    const [output, newCursor] = await db.objectStore.find(query, {
      limit,
      cursor: cursor.toString(),
      fields,
      from,
      order: parseOrder(fieldsMap, order),
      process: ({ data, usersdata }) => {
        return { ...data, user: db.user.cleanWriteOnlyResponse(usersdata) };
      },
    });

    res.status(200);

    if (output.length > 0 && newCursor) {
      res.links({ next: makeNextHREF(req, newCursor) });
    }
    return res.json(output);
  }

  if (!userId) {
    res.status(400);
    return res.json({
      errors: [`required query parameter: userId`],
    });
  }

  if (req.user.admin !== true && req.user.id !== userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own object stores"],
    });
  }

  const { data, cursor: newCursor } = await req.store.queryObjects({
    kind: "object-store",
    query: { userId: userId },
    limit,
    cursor,
  });

  res.status(200);
  if (data.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(data);
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
