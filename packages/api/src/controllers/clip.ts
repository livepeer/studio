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
import { toExternalAsset } from "./asset";
import { toStringValues } from "./helpers";
import mung from "express-mung";
import { Asset } from "../schema/types";
import { WithID } from "../store/types";
import { getRunningRecording } from "./session";

const app = Router();

app.use(
  mung.jsonAsync(async function cleanWriteOnlyResponses(
    data: WithID<Asset>[] | WithID<Asset> | { asset: WithID<Asset> },
    req
  ) {
    const { details } = toStringValues(req.query);
    const toExternalAssetFunc = (a: Asset) =>
      toExternalAsset(a, req.config, !!details, req.user.admin);

    if (Array.isArray(data)) {
      return Promise.all(data.map(toExternalAssetFunc));
    }
    if ("id" in data) {
      return toExternalAssetFunc(data);
    }
    if ("asset" in data) {
      return {
        ...data,
        asset: await toExternalAssetFunc(data.asset),
      };
    }
    return data;
  })
);

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
    await defaultObjectStoreId(req),
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

export default app;
