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
import { DBSession } from "../store/session-table";
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

  let url: string;
  let session: DBSession;
  let objectStoreId: string;

  if (isStream) {
    if (!content.record) {
      res.status(400).json({
        errors: ["Recording must be enabled on a live stream to create clips"],
      });
    }
    ({ url, session, objectStoreId } = await getRunningRecording(content, req));
  } else {
    res
      .status(400)
      .json({ errors: ["Clipping for assets is not implemented yet"] });
    return;
  }

  if (!session) {
    throw new Error("Recording session not found");
  }

  let asset = await validateAssetPayload(
    id,
    uPlaybackId,
    content.userId,
    Date.now(),
    defaultObjectStoreId(req),
    req.config,
    {
      name: req.body.name || `clip-${uPlaybackId}`,
    },
    {
      type: "clip",
      ...(isStream ? { sessionId: session.id } : { assetId: content.id }),
    }
  );

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
        sourceObjectStoreId: objectStoreId,
      },
    },
    null,
    asset,
    userId
  );

  res.json({
    task: { id: task.id },
    asset,
  });
});

async function getRunningRecording(content: DBStream, req: Request) {
  let objectStoreId: string;

  const session = await db.session.getLastSession(content.id);
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
    /*
    TODO: Enable to check if recording is running on the secondary one
    resp = await fetchWithTimeout(url, params);

    if (resp.status != 200) {
      throw new Error("Recording not found");
    }*/

    objectStoreId = req.config.secondaryRecordObjectStoreId;
  } else {
    objectStoreId = req.config.recordCatalystObjectStoreId;
  }

  return {
    url,
    session,
    objectStoreId,
  };
}

export default app;
