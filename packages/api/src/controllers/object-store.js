import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import { makeNextHREF } from "./helpers";
import uuid from "uuid/v4";
import { db } from "../store";

const app = Router();

app.get("/", authMiddleware({}), async (req, res) => {
  const { limit, cursor, userId } = req.query;
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
  const os = await req.store.get(`object-store/${req.params.id}`);
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
