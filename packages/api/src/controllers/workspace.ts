import { Request, RequestHandler, Router } from "express";
import { authorizer, validatePost } from "../middleware";
import { db } from "../store";
import { v4 as uuid } from "uuid";

const app = Router();

app.get("/", authorizer({}), async (req, res) => {
  res.status(200);
  res.json({});
});

app.post("/", authorizer({}), async (req, res) => {
  const { name } = req.body;

  const id = uuid();
  await db.workspace.create({
    id: id,
    name: "foo",
    userId: req.user.id,
    createdAt: Date.now(),
  });
  res.status(201).end();
});

export default app;
