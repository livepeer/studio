import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import { NotFoundError } from "../store/errors";
import { pathJoin } from "../controllers/helpers";
import {
  createAsset,
  validateAssetPayload,
  defaultObjectStoreId,
  catalystPipelineStrategy,
} from "./asset";
import { generateUniquePlaybackId } from "./generate-keys";
import { v4 as uuid } from "uuid";

const app = Router();

app.post("/", validatePost("clip-payload"), async (req, res) => {
  const playbackId = req.body.playbackId;
  const userId = req.user.id;

  const id = uuid();
  let uPlaybackId = await generateUniquePlaybackId(id);

  const content =
    (await db.stream.getByPlaybackId(playbackId)) ||
    (await db.asset.getByPlaybackId(playbackId));

  let isStream: boolean;
  if (content && "streamKey" in content) {
    isStream = true;
  }

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

  let url: string;

  if (isStream) {
    console.log(`fetching last session for stream ${content.id}`);
    let session = await db.stream.getLastSession(content.id);
    const os = await db.objectStore.get(req.config.recordCatalystObjectStoreId);
    url = pathJoin(os.publicUrl, session.playbackId, session.id, "output.m3u8");
  } else {
    const os = await db.objectStore.get(req.config.vodCatalystObjectStoreId);
    url = pathJoin(os.publicUrl, content.playbackId, content.id, "index.m3u8");
  }

  asset = await createAsset(asset, req.queue);

  const task = await req.taskScheduler.createAndScheduleTask(
    "clip",
    {
      clip: {
        clipStrategy: {
          playbackId,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
        catalystPipelineStrategy: catalystPipelineStrategy(req),
        url,
      },
    },
    null,
    asset,
    userId
  );

  res.json({
    task,
    asset,
  });
});

export default app;
