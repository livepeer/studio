import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import mung from "express-mung";
import { v4 as uuid } from "uuid";
import _ from "lodash";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
  FieldsMap,
  reqUseReplica,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { Asset, Task } from "../schema/types";
import { WithID } from "../store/types";
import { withIpfsUrls } from "./asset";
import { taskOutputToIpfsStorage } from "../store/asset-table";
import taskScheduler from "../task/scheduler";

const LOST_TASK_TIMEOUT = 15 * 60 * 1000; // 15 mins

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

const ipfsStorageToTaskOutput = (
  ipfs: Omit<Asset["storage"]["ipfs"], "spec">
): Task["output"]["export"]["ipfs"] => ({
  videoFileCid: ipfs.cid,
  videoFileUrl: ipfs.url,
  videoFileGatewayUrl: ipfs.gatewayUrl,
  nftMetadataCid: ipfs.nftMetadata?.cid,
  nftMetadataUrl: ipfs.nftMetadata?.url,
  nftMetadataGatewayUrl: ipfs.nftMetadata?.gatewayUrl,
});

function taskWithIpfsUrls(
  gatewayUrl: string,
  task: WithID<Task>
): WithID<Task> {
  if (task?.type !== "export" || !task?.output?.export?.ipfs) {
    return task;
  }
  const assetIpfs = taskOutputToIpfsStorage(task.output.export.ipfs);
  return _.merge({}, task, {
    output: {
      export: {
        ipfs: ipfsStorageToTaskOutput({
          ...withIpfsUrls(gatewayUrl, assetIpfs),
          nftMetadata: withIpfsUrls(gatewayUrl, assetIpfs.nftMetadata),
        }),
      },
    },
  });
}

const fieldsMap: FieldsMap = {
  id: `task.ID`,
  name: { val: `task.data->>'name'`, type: "full-text" },
  createdAt: { val: `task.data->'createdAt'`, type: "int" },
  updatedAt: { val: `task.data->'status'->'updatedAt'`, type: "int" },
  userId: `task.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  type: `task.data->>'type'`,
  inputAssetId: `task.data->>'inputAssetId'`,
  outputAssetId: `task.data->>'outputAssetId'`,
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

  const { ipfsGatewayUrl } = req.config;
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
          ...withIpfsUrls(ipfsGatewayUrl, data),
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
      return withIpfsUrls(ipfsGatewayUrl, data);
    },
  });

  res.status(200);

  if (output.length > 0) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:id", authorizer({}), async (req, res) => {
  const task = await db.task.get(req.params.id, {
    useReplica: reqUseReplica(req),
  });
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

  res.json(taskWithIpfsUrls(req.config.ipfsGatewayUrl, task));
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
  const task = await db.task.get(id, { useReplica: false });
  if (!task) {
    return res.status(404).json({ errors: ["not found"] });
  } else if (
    task.status?.phase !== "waiting" &&
    task.status?.phase !== "running"
  ) {
    return res.status(400).json({ errors: ["task is not running"] });
  }
  const user = await db.user.get(task.userId);
  if (!user) {
    return res.status(500).json({ errors: ["user not found"] });
  }
  if (!user.admin && task.status.phase !== "running" && !task.status.retries) {
    // first attempt to execute the task. check concurrent tasks limit
    const query = [
      sql`task.data->>'deleted' IS NULL`,
      sql`task.data->>'userId' = ${user.id}`,
      sql`task.data->'status'->>'phase' = 'running' OR `.append(
        `(task.data->'status'->>'phase' = 'waiting' AND task.data->'status'->>'retries' IS NOT NULL)')`
      ),
    ];
    const maxAllowed = req.config.vodMaxConcurrentTasksPerUser;
    let [tasks] = await db.task.find(query, { limit: 2 * maxAllowed });
    const lostTaskThreshold = Date.now() - LOST_TASK_TIMEOUT;
    tasks = tasks.filter((t) => {
      if (t.status.updatedAt > lostTaskThreshold) {
        return true;
      }
      taskScheduler
        .failTask(task, "internal error executing task")
        .catch((err) =>
          console.error(`error failing task id=${task.id} err=`, err)
        );
      return false;
    });
    if (tasks.length >= maxAllowed) {
      return res.status(429).json({
        errors: [
          `too many tasks running for user ${user.id} (${tasks.length})`,
        ],
      });
    }
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
    phase: "running",
    updatedAt: Date.now(),
    retries: task.status.retries,
    progress: doc.progress,
    step: doc.step,
  };
  await req.taskScheduler.updateTask(
    task,
    { status },
    { allowedPhases: ["waiting", "running"] }
  );
  if (task.outputAssetId) {
    await req.taskScheduler.updateAsset(
      task.outputAssetId,
      {
        status: {
          phase: "processing",
          updatedAt: Date.now(),
          progress: doc.progress,
        },
      },
      { allowedPhases: ["waiting", "processing"] }
    );
  }
  if (task.inputAssetId) {
    const asset = await db.asset.get(task.inputAssetId);
    if (task.id === asset?.storage?.status?.tasks.pending) {
      await req.taskScheduler.updateAsset(asset.id, {
        storage: {
          ...asset.storage,
          status: {
            phase: "processing",
            progress: doc.progress,
            tasks: asset.storage.status.tasks,
          },
        },
      });
    }
  }

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
