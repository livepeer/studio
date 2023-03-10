import { authorizer, validatePost } from "../middleware";
import { Router } from "express";
import { TranscodePayload } from "../schema/types";
import {
  toObjectStoreUrl,
  ObjectStoreStorage,
  toWeb3StorageUrl,
} from "./helpers";
import { ensureQueueCapacity } from "../task/scheduler";
import { cleanTaskResponses } from "./task";

const app = Router();

app.use(cleanTaskResponses());

app.post(
  "/",
  authorizer({}),
  validatePost("transcode-payload"),
  async (req, res) => {
    const params = req.body as TranscodePayload;
    const { catalystPipelineStrategy = "external" } = req.user.admin
      ? params
      : {};

    await ensureQueueCapacity(req.config, req.user.id);

    let inUrl = params.input["url"];
    if (!inUrl) {
      inUrl =
        toObjectStoreUrl(params.input as ObjectStoreStorage) +
        params.input["path"];
    }
    const storageUrl =
      params.storage.type === "web3.storage"
        ? toWeb3StorageUrl(params.storage)
        : toObjectStoreUrl(params.storage);

    const task = await req.taskScheduler.spawnAndScheduleTask(
      "transcode-file",
      {
        ["transcode-file"]: {
          input: {
            url: inUrl,
          },
          storage: {
            url: storageUrl,
          },
          outputs: params.outputs,
          profiles: params.profiles,
          targetSegmentSizeSecs: params.targetSegmentSizeSecs,
          catalystPipelineStrategy,
        },
      },
      null,
      null,
      req.user.id
    );
    res.json(task);
  }
);

export default app;
