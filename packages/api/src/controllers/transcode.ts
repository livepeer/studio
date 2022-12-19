import { authorizer, validatePost } from "../middleware";
import { Router } from "express";
import { TranscodePayload } from "../schema/types";
import { toObjectStoreUrl } from "./helpers";
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

    const taskType = "transcode-file";
    let inUrl = params.input.url;
    if (!inUrl) {
      if (!params.input.path) {
        throw new Error("Undefined property 'input.path'");
      }
      inUrl = toObjectStoreUrl(params.input) + params.input.path;
    }
    const storageUrl = toObjectStoreUrl(params.storage);

    const task = await req.taskScheduler.spawnTask(
      taskType,
      {
        [taskType]: {
          input: {
            url: inUrl,
          },
          storage: {
            url: storageUrl,
          },
          outputs: params.outputs,
          catalystPipelineStrategy,
        },
      },
      null,
      null,
      req.user.id
    );
    await req.taskScheduler.enqueueTask(task);
    res.json({ task: { id: task.id } });
  }
);

export default app;
