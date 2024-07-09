import { Router } from "express";
import mung from "express-mung";
import _ from "lodash";
import sql from "sql-template-strings";
import { v4 as uuid } from "uuid";
import { authorizer, validatePost } from "../middleware";
import { CliArgs } from "../parse-cli";
import { Asset, Task } from "../schema/types";
import { db } from "../store";
import { taskOutputToIpfsStorage } from "../store/asset-table";
import { TooManyRequestsError } from "../store/errors";
import { WithID } from "../store/types";
import { assetEncryptionWithoutKey, withIpfsUrls } from "./asset";
import {
  FieldsMap,
  deleteCredentials,
  makeNextHREF,
  parseFilters,
  parseOrder,
  reqUseReplica,
  sqlQueryGroup,
  toStringValues,
} from "./helpers";

const app = Router();

function validateTaskPayload(
  id: string,
  userId: string,
  createdAt: number,
  payload,
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
  ipfs: Omit<Asset["storage"]["ipfs"], "spec">,
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
  task: WithID<Task>,
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

export function taskParamsWithoutCredentials(
  type: Task["type"],
  params: Task["params"],
): Task["params"] {
  const result = _.cloneDeep(params);
  switch (type) {
    case "transcode-file":
      result["transcode-file"].input.url = deleteCredentials(
        params["transcode-file"].input.url,
      );
      result["transcode-file"].storage.url = deleteCredentials(
        params["transcode-file"].storage.url,
      );
      break;
    case "upload":
      const encryption = params.upload?.encryption;
      if (encryption) {
        result.upload.encryption = assetEncryptionWithoutKey(encryption);
      }
      break;
  }
  return result;
}

export async function getProcessingTasksByRequesterId(
  requesterId: string,
  ownerId: string,
  taskType?: string,
  timeFrame?: number, // in minutes
): Promise<WithID<Task>[]> {
  if (!timeFrame) {
    timeFrame = 60;
  }
  const scheduledAt = Date.now() - timeFrame * 60 * 1000;
  const phases = ["running", "pending", "waiting"];
  const typeCondition = taskType ? sql`data->>'type' = ${taskType}` : "true";

  const [tasks] = await db.task.find([
    sql`data->>'userId' = ${ownerId}`,
    sql`coalesce((data->>'scheduledAt')::bigint, 0) > ${scheduledAt}`,
    sql`data->'status'->>'phase' IN `.append(sqlQueryGroup(phases)),
    typeCondition,
  ]);

  return tasks.filter((task) => task.requesterId === requesterId);
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

export function toExternalTask(
  t: WithID<Task>,
  config: CliArgs,
  isAdmin = false,
) {
  t = taskWithIpfsUrls(config.ipfsGatewayUrl, t);
  if (isAdmin) {
    return t;
  }

  t.params = taskParamsWithoutCredentials(t.type, t.params);
  return db.task.cleanWriteOnlyResponse(t);
}

export const cleanTaskResponses = () =>
  mung.jsonAsync(async function cleanWriteOnlyResponses(data, req) {
    const toExternalTaskFunc = (t: WithID<Task>) =>
      toExternalTask(t, req.config, req.user.admin);

    if (Array.isArray(data)) {
      return data.map(toExternalTaskFunc);
    }
    if ("id" in data) {
      return toExternalTaskFunc(data as WithID<Task>);
    }
    return data;
  });

app.use(cleanTaskResponses());

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

  if (!all || all === "false" || !req.user.admin) {
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

  res.json(task);
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
  },
);

app.post("/:id/retry", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const task = await db.task.get(id, { useReplica: false });
  if (!task) {
    return res.status(404).json({ errors: ["task not found"] });
  } else if (!["failed", "cancelled"].includes(task.status?.phase)) {
    return res
      .status(400)
      .json({ errors: ["task is not in a retryable state"] });
  }

  const user = await db.user.get(task.userId);
  if (!user) {
    return res.status(500).json({ errors: ["user not found"] });
  }

  if (!req.user.admin && req.user.id !== task.userId) {
    return res.status(403).json({
      errors: ["users may only retry their own tasks"],
    });
  }

  await req.taskScheduler.retryTask(task, task.status?.errorMessage, true);

  res.status(200);
  res.json({ id });
});

app.post("/:id/status", authorizer({ anyAdmin: true }), async (req, res) => {
  // update status of a specific task
  const { id } = req.params;
  const task = await db.task.get(id, { useReplica: false });
  if (!task) {
    return res.status(404).json({ errors: ["not found"] });
  } else if (!["waiting", "running"].includes(task.status?.phase)) {
    return res
      .status(400)
      .json({ errors: ["task is not in an executable state"] });
  }

  const user = await db.user.get(task.userId);
  if (!user) {
    return res.status(500).json({ errors: ["task user not found"] });
  } else if (user.suspended || user.disabled) {
    return res.status(403).json({
      errors: [`task user is ${user.suspended ? "suspended" : "disabled"}`],
    });
  }

  const { phase, retries } = task.status;
  // allow test users to run as many tasks as necessary
  if (!user.isTestUser && phase === "waiting" && !retries) {
    // this is an attempt to start executing the task for the first time. check concurrent tasks limit
    const numRunning = await db.task.countRunningTasks(req.user.id);
    if (numRunning >= req.config.vodMaxConcurrentTasksPerUser) {
      throw new TooManyRequestsError(
        `too many tasks running for user ${user.id} (${numRunning})`,
      );
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
    { allowedPhases: ["waiting", "running"] },
  );
  if (task.outputAssetId) {
    const asset = await db.asset.get(task.outputAssetId);
    await req.taskScheduler.updateAsset(
      asset,
      {
        status: {
          phase: "processing",
          updatedAt: Date.now(),
          progress: Math.max(doc.progress, asset.status.progress ?? 0),
        },
      },
      { allowedPhases: ["waiting", "processing"] },
    );
  }
  if (task.inputAssetId) {
    const asset = await db.asset.get(task.inputAssetId);
    if (task.id === asset?.storage?.status?.tasks.pending) {
      const progress = Math.max(
        doc.progress,
        asset.storage.status.progress ?? 0,
      );
      await req.taskScheduler.updateAsset(asset, {
        storage: {
          ...asset.storage,
          status: {
            phase: "processing",
            progress,
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
