import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import mung from "express-mung";
import { v4 as uuid } from "uuid";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
  FieldsMap,
  pathJoin,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { Task } from "../schema/types";
import { WithID } from "../store/types";

const ipfsGateway = "https://ipfs.livepeer.com/ipfs/";

const app = Router();

function validateTaskPayload(
  id: string,
  userId: string,
  createdAt: number,
  payload
) {
  return {
    id,
    userId,
    createdAt,
    name: payload.name,
    type: payload.type,
  };
}

function withIpfsUrls(task: WithID<Task>): WithID<Task> {
  if (task?.type !== "export" || !task?.output?.export?.ipfs?.videoFileCid) {
    return task;
  }
  let { ipfs } = task.output.export;
  ipfs = {
    ...ipfs,
    videoFileUrl: `ipfs://${ipfs.videoFileCid}`,
    videoFileGatewayUrl: pathJoin(ipfsGateway, ipfs.videoFileCid),
  };
  if (ipfs.nftMetadataCid) {
    ipfs = {
      ...ipfs,
      nftMetadataUrl: `ipfs://${ipfs.nftMetadataCid}`,
      nftMetadataGatewayUrl: pathJoin(ipfsGateway, ipfs.nftMetadataCid),
    };
  }
  return {
    ...task,
    output: {
      ...task.output,
      export: {
        ...task.output.export,
        ipfs,
      },
    },
  };
}

const fieldsMap: FieldsMap = {
  id: `task.ID`,
  name: { val: `task.data->>'name'`, type: "full-text" },
  createdAt: { val: `task.data->'createdAt'`, type: "int" },
  updatedAt: { val: `task.data->'status'->'updatedAt'`, type: "int" },
  userId: `task.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  type: `task.data->>'type'`,
};

app.use(
  mung.json(function cleanWriteOnlyResponses(data, req) {
    if (req.user.admin) {
      return data;
    }
    if (Array.isArray(data)) {
      return db.task.cleanWriteOnlyResponses(data);
    }
    if ("id" in data) {
      return db.task.cleanWriteOnlyResponse(data as WithID<Task>);
    }
    return data;
  })
);

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, all, event, allUsers, order, filters, count } =
    toStringValues(req.query);
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  if (req.user.admin && allUsers && allUsers !== "false") {
    const query = parseFilters(fieldsMap, filters);
    if (!all || all === "false") {
      query.push(sql`task.data->>'deleted' IS NULL`);
    }

    let fields =
      " task.id as id, task.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `task left join users on task.data->>'userId' = users.id`;
    const [output, newCursor] = await db.task.find(query, {
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
          ...withIpfsUrls(data),
          user: db.user.cleanWriteOnlyResponse(usersdata),
        };
      },
    });

    res.status(200);

    if (output.length > 0 && newCursor) {
      res.links({ next: makeNextHREF(req, newCursor) });
    }
    return res.json(output);
  }

  const query = parseFilters(fieldsMap, filters);
  query.push(sql`task.data->>'userId' = ${req.user.id}`);

  if (!all || all === "false") {
    query.push(sql`task.data->>'deleted' IS NULL`);
  }

  let fields = " task.id as id, task.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `task`;
  const [output, newCursor] = await db.task.find(query, {
    limit,
    cursor,
    fields,
    from,
    order: parseOrder(fieldsMap, order),
    process: ({ data, count: c }) => {
      if (count) {
        res.set("X-Total-Count", c);
      }
      return withIpfsUrls(data);
    },
  });

  res.status(200);

  if (output.length > 0) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:id", authorizer({}), async (req, res) => {
  const task = await db.task.get(req.params.id);
  if (!task) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }

  if (req.user.admin !== true && req.user.id !== task.userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own tasks"],
    });
  }

  res.json(withIpfsUrls(task));
});

app.post(
  "/",
  authorizer({ anyAdmin: true }),
  validatePost("task"),
  async (req, res) => {
    const id = uuid();
    const doc = validateTaskPayload(id, req.user.id, Date.now(), req.body);

    await db.task.create(doc);

    res.status(201);
    res.json(doc);
  }
);

app.post("/:id/status", authorizer({ anyAdmin: true }), async (req, res) => {
  // update status of a specific task
  const { id } = req.params;
  const task = await db.task.get(id);
  if (!task) {
    return res.status(404).json({ errors: ["not found"] });
  }

  const doc = req.body.status;
  if (!doc) {
    return res.status(422).json({ errors: ["missing status in payload"] });
  } else if (doc.phase && doc.phase !== "running") {
    return res
      .status(422)
      .json({ errors: ["can only update phase to running"] });
  }
  const status: Task["status"] = {
    ...task.status,
    phase: "running",
    progress: doc.progress,
    updatedAt: Date.now(),
  };
  await db.task.update(id, { status });

  res.status(200);
  res.json({ id, status });
});

app.delete("/:id", authorizer({ anyAdmin: true }), async (req, res) => {
  const { id } = req.params;
  const task = await db.task.get(id);
  if (!task) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== task.userId) {
    res.status(403);
    return res.json({
      errors: ["users may only delete their own tasks"],
    });
  }
  await db.task.delete(id);
  res.status(204);
  res.end();
});

export default app;
