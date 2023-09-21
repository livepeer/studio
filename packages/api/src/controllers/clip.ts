import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import { NotFoundError } from "../store/errors";
import {
  createAsset,
  validateAssetPayload,
  defaultObjectStoreId,
} from "./asset";
import { generateUniquePlaybackId } from "./generate-keys";
import { v4 as uuid } from "uuid";

const app = Router();

app.post("/clip", validatePost("clip-payload"), async (req, res) => {
  const playbackId = req.body.playbackId;
  const userId = req.user.id;

  const id = uuid();
  let uPlaybackId = await generateUniquePlaybackId(id);

  const content =
    (await db.stream.getByPlaybackId(playbackId)) ||
    (await db.asset.getByPlaybackId(playbackId));

  if (!content) {
    throw new NotFoundError("Content not found");
  }

  const user = await db.user.get(content.userId);

  if (!user || userId !== content.userId) {
    throw new NotFoundError("Content not found");
  }

  if ("suspended" in content && content.suspended) {
    throw new NotFoundError("Content not found");
  }

  let asset = await validateAssetPayload(
    id,
    uPlaybackId,
    content.userId,
    Date.now(),
    defaultObjectStoreId(req),
    req.config,
    {
      name: req.body.name || `clip_${uPlaybackId}`,
    },
    // TODO: actual type `clip` - currently something's wrong with the types when setting up the schema
    { type: "directUpload", sourceId: content.id }
  );

  asset = await createAsset(asset, req.queue);

  const task = await req.taskScheduler.createAndScheduleTask("clip", {
    clip: {
      playbackId,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    },
  });

  res.json({
    task,
    asset,
  });
});

export default app;
