import { Request, Router } from "express";
import { authorizer } from "../middleware";
import { db, jobsDb } from "../store";
import { v4 as uuid } from "uuid";
import {
  deleteAllOwnedObjects,
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import { NotFoundError, ForbiddenError } from "../store/errors";
import sql from "sql-template-strings";
import { WithID } from "../store/types";
import { Asset, Project } from "../schema/types";
import { CliArgs } from "../parse-cli";
import Queue from "../store/queue";
import logger from "../logger";
import { DB } from "../store/db";

const app = Router();

const fieldsMap = {
  id: `project.ID`,
  name: { val: `project.data->>'name'`, type: "full-text" },
  createdAt: { val: `project.data->'createdAt'`, type: "int" },
  userId: `project.data->>'userId'`,
} as const;

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, order, all, filters, count, allUsers } = toStringValues(
    req.query,
  );

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
  if (req.user.admin && allUsers && allUsers !== "false") {
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

app.get("/:id", authorizer({}), async (req, res) => {
  const project = await db.project.get(req.params.id, {
    useReplica: false,
  });

  if (!project || project.deleted) {
    res.status(403);
    return res.json({ errors: ["project not found"] });
  }

  if (req.user.admin !== true && req.user.id !== project.userId) {
    throw new ForbiddenError(
      "user can only request information on their own projects",
    );
  }

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
  res.json(project);
});

app.patch("/:id", authorizer({}), async (req, res) => {
  const project = await db.project.get(req.params.id, {
    useReplica: false,
  });

  if (!project || project.deleted) {
    throw new NotFoundError(`project not found`);
  }

  if (req.user.admin !== true && req.user.id !== project.userId) {
    throw new ForbiddenError("user can only update their own projects");
  }

  const { name } = req.body;

  await db.project.update(req.params.id, {
    name: name,
  });

  res.status(204);
  res.end();
});

app.delete("/:id", authorizer({}), async (req, res) => {
  const project = await db.project.get(req.params.id, {
    useReplica: false,
  });

  if (!project || project.deleted) {
    throw new NotFoundError(`project not found`);
  }

  if (req.user.admin !== true && req.user.id !== project.userId) {
    throw new ForbiddenError("user can only delete their own projects");
  }

  // Todo: Long running cronjob for cascade delete

  res.status(204);
  res.end();
});

app.post(
  "/job/projects-cleanup",
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    // import the job dynamically to avoid circular dependencies
    const { default: projectsCleanup } = await import(
      "../jobs/projects-cleanup"
    );

    const limit = parseInt(req.query.limit?.toString()) || 1000;

    const { cleanedUp } = await projectsCleanup(
      {
        ...req.config,
        projectsCleanupLimit: limit,
      },
      req,
      { jobsDb },
    );

    res.status(200);
    res.json({ cleanedUp });
  },
);

export function triggerCleanUpProjectsJob(
  projects: Project[],
  req: Request,
): [Project[], Promise<void>] {
  if (!projects.length) {
    return [projects, Promise.resolve()];
  }

  const jobPromise = Promise.resolve().then(async () => {
    try {
      await Promise.all(projects.map((s) => cleanUpProject(s, req)));
    } catch (err) {
      const ids = projects.map((s) => s.id);
      logger.error(`Error cleaning up projectId=${ids} err=`, err);
    }
  });

  return [projects, jobPromise];
}

async function cleanUpProject(project: Project, req: Request) {
  await deleteAllOwnedObjects(req, { projectId: project.id, deleted: false });
}

export default app;
