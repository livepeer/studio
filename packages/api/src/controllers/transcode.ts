import { authorizer, validatePost } from "../middleware";
import { Router } from "express";
import { TranscodePayload } from "../schema/types";
import {
  toObjectStoreUrl,
  ObjectStoreStorage,
  taskWithoutCredentials,
} from "./helpers";
import { ensureQueueCapacity } from "../task/scheduler";

const app = Router();

app.post(
  "/",
  authorizer({}),
  validatePost("transcode-payload"),
  async (req, res) => {
    const params = req.body as TranscodePayload;
    const { catalystPipelineStrategy = undefined } = req.user.admin
      ? params
      : {};

    await ensureQueueCapacity(req.config, req.user.id);

    let inUrl = params.input["url"];
    if (!inUrl) {
      inUrl =
        toObjectStoreUrl(params.input as ObjectStoreStorage) +
        params.input["path"];
    }
    const storageUrl = toObjectStoreUrl(params.storage);

    const task = await req.taskScheduler.scheduleTask(
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
          catalystPipelineStrategy,
        },
      },
      null,
      null,
      req.user.id
    );
    res.json(taskWithoutCredentials(task));
  }
);

export default app;
