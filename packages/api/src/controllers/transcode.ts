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
    const { catalystPipelineStrategy = undefined } = req.user.admin
      ? params
      : {};

    await ensureQueueCapacity(req.config, req.user.id);

    let inUrl = params.input["url"];
    if (!inUrl) {
      let path = params.input["path"];
      if (!path.startsWith("/")) {
        path = "/" + path;
      }
      inUrl = toObjectStoreUrl(params.input as ObjectStoreStorage) + path;
    }
    const storageUrl =
      params.storage.type === "web3.storage"
        ? toWeb3StorageUrl(params.storage)
        : toObjectStoreUrl(params.storage);

    const outputs = params.outputs;
    if (outputs.hls?.path != null && !outputs.hls.path.startsWith("/")) {
      outputs.hls.path = "/" + outputs.hls.path;
    }
    if (outputs.mp4?.path != null && !outputs.mp4.path.startsWith("/")) {
      outputs.mp4.path = "/" + outputs.mp4.path;
    }
    if (outputs.fmp4?.path != null && !outputs.fmp4.path.startsWith("/")) {
      outputs.fmp4.path = "/" + outputs.fmp4.path;
    }

    const task = await req.taskScheduler.createAndScheduleTask(
      "transcode-file",
      {
        ["transcode-file"]: {
          input: {
            url: inUrl,
          },
          storage: {
            url: storageUrl,
          },
          outputs,
          profiles: params.profiles,
          targetSegmentSizeSecs: params.targetSegmentSizeSecs,
          creatorId: params.creatorId,
          c2pa: params.c2pa,
          catalystPipelineStrategy,
        },
      },
      req.user,
      null,
      null,
      req.user.id,
    );
    res.json(task);
  },
);

export default app;
