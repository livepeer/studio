import { Request, RequestHandler, Router } from "express";
import { authorizer, validatePost } from "../middleware";
import { db } from "../store";
import { v4 as uuid } from "uuid";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  getS3PresignedUrl,
  toStringValues,
  pathJoin,
  getObjectStoreS3Config,
  reqUseReplica,
  isValidBase64,
  mapInputCreatorId,
} from "./helpers";
import sql from "sql-template-strings";
import {
  ForbiddenError,
  UnprocessableEntityError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  NotImplementedError,
} from "../store/errors";

const app = Router();

export async function getProject(req: Request, projectId: string) {
  const project = projectId
    ? await db.project.get(projectId)
    : { name: "default", userId: req.user.id };
  if (!req.user.admin && req.user.id !== project.userId) {
    throw new ForbiddenError(`invalid user`);
  }

  console.log("XXX: got project:", projectId, project);
  return project;
}

const fieldsMap = {
  id: `project.ID`,
  name: { val: `project.data->>'name'`, type: "full-text" },
  createdAt: { val: `project.data->'createdAt'`, type: "int" },
  userId: `project.data->>'userId'`,
} as const;

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, order, all, filters, count } = toStringValues(req.query);

  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  const query = [...parseFilters(fieldsMap, filters)];

  if (!req.user.admin || !all || all === "false") {
    query.push(sql`project.data->>'deleted' IS NULL`);
  }

  let output: WithID<Project>[];
  let newCursor: string;
  if (req.user.admin) {
    let fields =
      " project.id as id, project.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `project left join users on project.data->>'userId' = users.id`;
    [output, newCursor] = await db.project.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(fieldsMap, order),
      process: ({ data, usersdata, count: c }) => {
        if (count) {
          res.set("X-Total-Count", c);
        }
        return {
          ...data,
          user: db.user.cleanWriteOnlyResponse(usersdata),
        };
      },
    });
  } else {
    query.push(sql`project.data->>'userId' = ${req.user.id}`);

    let fields = " project.id as id, project.data as data";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    [output, newCursor] = await db.project.find(query, {
      limit,
      cursor,
      fields,
      order: parseOrder(fieldsMap, order),
      process: ({ data, count: c }) => {
        if (count) {
          res.set("X-Total-Count", c);
        }
        return data;
      },
    });
  }

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:projectId", authorizer({}), async (req, res) => {
  const project = await req.project;

  if (!project) {
    res.status(403);
    return res.json({ errors: ["project not found"] });
  }

  res.status(200);
  res.json(project);
});

app.post("/", authorizer({}), async (req, res) => {
  const { name } = req.body;

  const id = uuid();
  await db.project.create({
    id: id,
    name: name,
    userId: req.user.id,
    createdAt: Date.now(),
  });

  const project = await db.project.get(id, { useReplica: false });

  if (!project) {
    res.status(403);
    return res.json({ errors: ["project not created"] });
  }

  res.status(201);
  res.json(id);
});

export default app;
