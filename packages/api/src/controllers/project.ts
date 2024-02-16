import { Request, RequestHandler, Router } from "express";
import { authorizer, validatePost } from "../middleware";
import { db } from "../store";
import { v4 as uuid } from "uuid";

const app = Router();

async function getProject(req) {
  const project = await db.project.get(req.params.projectId);

  if (!project || project.deleted) {
    throw new NotFoundError(`project not found`);
  }

  if (!req.user.admin && req.user.id !== project.userId) {
    throw new ForbiddenError(`invalid user`);
  }

  return project;
}

app.get("/:projectId", authorizer({}), async (req, res) => {
  const project = await getProject(req);

  if (!project) {
    res.status(403);
    return res.json({ errors: ["project not found"] });
  }

  res.status(200);
  res.json(project);
});

app.post("/", authorizer({}), async (req, res) => {
  const { name } = req.body;

  console.log("XXX: req.user", req.user);

  const id = uuid();
  await db.project.create({
    id: id,
    name: "foo",
    userId: req.user.id,
    createdAt: Date.now(),
  });
  res.status(201);

  const project = await db.project.get(id, { useReplica: false });

  if (!project) {
    res.status(403);
    return res.json({ errors: ["project not created"] });
  }

  res.status(201);
  res.json(id);
});

export default app;
