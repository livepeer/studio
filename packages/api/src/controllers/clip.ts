import { validatePost } from "../middleware";
import { Request, Router } from "express";
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
import { DBSession } from "../store/db";
import { fetchWithTimeout } from "../util";
import { DBStream } from "../store/stream-table";

const app = Router();

app.post("/", validatePost("clip-payload"), async (req, res) => {
  const playbackId = req.body.playbackId;
  const userId = req.user.id;

  const id = uuid();
  let uPlaybackId = await generateUniquePlaybackId(id);

  const content = await db.stream.getByPlaybackId(playbackId); //||
  //(await db.asset.getByPlaybackId(playbackId));

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

  let session: DBSession;
  if (isStream) {
    if (!content.record) {
      res.status(400).json({
        errors: ["Recording must be enabled on a live stream to create clips"],
      });
    }
    url = await getRecordingUrl(content, req);
  } else {
    res
      .status(400)
      .json({ errors: ["Clipping for assets is not implemented yet"] });
    return;
    //const os = await db.objectStore.get(req.config.vodCatalystObjectStoreId);
    //url = pathJoin(os.publicUrl, content.playbackId, content.id, "index.m3u8");
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
        sessionId: session.id,
        inputId: content.id,
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

async function getRecordingUrl(content: DBStream, req: Request) {
  const session = await db.stream.getLastSessionFromSessionsTable(content.id);
  const os = await db.objectStore.get(req.config.recordCatalystObjectStoreId);

  let url = pathJoin(
    os.publicUrl,
    session.playbackId,
    session.id,
    "output.m3u8"
  );

  let params = {
    method: "HEAD",
    timeout: 5 * 1000,
  };
  let resp = await fetchWithTimeout(url, params);

  if (resp.status != 200) {
    const secondaryOs = req.config.secondaryRecordObjectStoreId
      ? await db.objectStore.get(req.config.secondaryRecordObjectStoreId)
      : undefined;
    url = pathJoin(
      secondaryOs.publicUrl,
      session.playbackId,
      session.id,
      "output.m3u8"
    );
  }

  /*resp = await fetchWithTimeout(url, params);

  if (resp.status != 200) {
    throw new Error("Recording not found");
  }*/

  return url;
}

export default app;
