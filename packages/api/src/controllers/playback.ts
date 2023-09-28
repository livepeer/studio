import { Request, Router } from "express";
import { db } from "../store";
import {
  getHLSPlaybackUrl,
  getWebRTCPlaybackUrl,
  getRecordingFields,
  getRecordingPlaybackUrl,
} from "./stream";
import {
  getPlaybackUrl as assetPlaybackUrl,
  getStaticPlaybackInfo,
  StaticPlaybackInfo,
} from "./asset";
import { CliArgs } from "../parse-cli";
import { DBSession } from "../store/session-table";
import { Asset, PlaybackInfo, Stream, User } from "../schema/types";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
import { NotFoundError, UnprocessableEntityError } from "../store/errors";
import { isExperimentSubject } from "../store/experiment-table";
import logger from "../logger";
import { getRunningRecording } from "./session";

/**
 * CROSS_USER_ASSETS_CUTOFF_DATE represents the cut-off date for cross-account
 * asset playback. Assets created before this date can still be played by other
 * accounts by dStorage ID. Assets created after this date will not have
 * cross-account playback enabled, ensuring users are billed appropriately. This
 * was made for backward compatibility during the Viewership V2 deploy.
 */
const CROSS_USER_ASSETS_CUTOFF_DATE = 1686009600000; // 2023-06-06T00:00:00.000Z

var embeddablePlayerOrigin = /^https:\/\/(.+\.)?lvpr.tv$/;

function newPlaybackInfo(
  type: PlaybackInfo["type"],
  hlsUrl: string,
  webRtcUrl?: string | null,
  playbackPolicy?: Asset["playbackPolicy"] | Stream["playbackPolicy"],
  staticFilesPlaybackInfo?: StaticPlaybackInfo[],
  live?: PlaybackInfo["meta"]["live"],
  recordingUrl?: string,
  withRecordings?: boolean,
  streamRecord?: boolean
): PlaybackInfo {
  let playbackInfo: PlaybackInfo = {
    type,
    meta: {
      live,
      playbackPolicy,
      source: [],
    },
  };
  if (staticFilesPlaybackInfo && staticFilesPlaybackInfo.length > 0) {
    for (let staticFile of staticFilesPlaybackInfo) {
      playbackInfo.meta.source.push({
        hrn: "MP4",
        type: "html5/video/mp4",
        url: staticFile.playbackUrl,
        size: staticFile.size,
        width: staticFile.width,
        height: staticFile.height,
        bitrate: staticFile.bitrate,
      });
    }
  }
  playbackInfo.meta.source.push({
    hrn: "HLS (TS)",
    type: "html5/application/vnd.apple.mpegurl",
    url: hlsUrl,
  });
  if (webRtcUrl) {
    playbackInfo.meta.source.push({
      hrn: "WebRTC (H264)",
      type: "html5/video/h264",
      url: webRtcUrl,
    });
  }
  if (withRecordings) {
    playbackInfo.meta.dvrPlayback = [];
    if (!streamRecord) {
      playbackInfo.meta.dvrPlayback.push({
        error: "recording is not enabled for this stream.",
      });
    } else if (recordingUrl) {
      playbackInfo.meta.dvrPlayback.push({
        hrn: "HLS (TS)",
        type: "html5/application/vnd.apple.mpegurl",
        url: recordingUrl,
      });
    } else {
      playbackInfo.meta.dvrPlayback.push({
        error: "no running recordings available for this stream.",
      });
    }
  }

  return playbackInfo;
}

const getAssetPlaybackInfo = async (
  config: CliArgs,
  ingest: string,
  asset: WithID<Asset>
) => {
  const os = await db.objectStore.get(asset.objectStoreId);
  if (!os || os.deleted || os.disabled) {
    return null;
  }

  const playbackUrl = assetPlaybackUrl(ingest, asset, os);

  if (!playbackUrl) {
    return null;
  }

  return newPlaybackInfo(
    "vod",
    playbackUrl,
    null,
    asset.playbackPolicy || null,
    getStaticPlaybackInfo(asset, os)
  );
};

export async function getResourceByPlaybackId(
  id: string,
  user?: User,
  cutoffDate?: number,
  origin?: string
): Promise<{ stream?: DBStream; session?: DBSession; asset?: WithID<Asset> }> {
  let asset =
    (await db.asset.getByPlaybackId(id)) ??
    (await db.asset.getByIpfsCid(id, user, cutoffDate)) ??
    (await db.asset.getBySourceURL("ipfs://" + id, user, cutoffDate)) ??
    (await db.asset.getBySourceURL("ar://" + id, user, cutoffDate));

  if (asset && !asset.deleted) {
    if (asset.status.phase !== "ready" && !asset.sourcePlaybackReady) {
      throw new UnprocessableEntityError("asset is not ready for playback");
    }
    if (asset.userId !== user?.id && cutoffDate) {
      console.log(
        `Returning cross-user asset for playback. ` +
          `userId=${user?.id} userEmail=${user?.email} origin=${origin} ` +
          `assetId=${asset.id} assetUserId=${asset.userId} playbackId=${asset.playbackId}`
      );
    }
    return { asset };
  }

  let stream = await db.stream.getByPlaybackId(id);
  if (!stream) {
    const streamById = await db.stream.get(id);
    // only allow retrieving child streams by ID
    if (streamById?.parentId) {
      stream = streamById;
    }
  }
  if (stream && !stream.deleted && !stream.suspended) {
    return { stream };
  }

  const session = await db.session.get(id);
  if (session && !session.deleted) {
    return { session };
  }

  return {};
}
async function getAttestationPlaybackInfo(
  config: CliArgs,
  ingest: string,
  id: string,
  user?: User,
  cutoffDate?: number
): Promise<PlaybackInfo> {
  try {
    if (!isExperimentSubject("attestation", user?.id)) {
      return null;
    }

    const attestation = await db.attestation.getByIdOrCid(id);
    const videoUrl = attestation?.message?.video;

    // Currently we only support attestations for videos stored in IPFS
    if (!videoUrl?.startsWith("ipfs://")) {
      return null;
    }
    const videoCid = videoUrl.slice("ipfs://".length);
    const asset = await db.asset.getByIpfsCid(videoCid, user, cutoffDate);
    if (!asset) {
      return null;
    }

    const assetPlaybackInfo = await getAssetPlaybackInfo(config, ingest, asset);
    assetPlaybackInfo.meta.attestation = attestation;
    return assetPlaybackInfo;
  } catch (e) {
    logger.warn("Error while resolving playback from video attestation", e);
    return null;
  }
}

async function getPlaybackInfo(
  req: Request,
  ingest: string,
  id: string,
  isCrossUserQuery: boolean,
  origin: string,
  withRecordings?: boolean
): Promise<PlaybackInfo> {
  const cutoffDate = isCrossUserQuery ? null : CROSS_USER_ASSETS_CUTOFF_DATE;
  let { stream, asset, session } = await getResourceByPlaybackId(
    id,
    req.user,
    cutoffDate,
    origin
  );

  if (asset) {
    return await getAssetPlaybackInfo(req.config, ingest, asset);
  }

  // Streams represent "transcoding sessions" when they are a child stream, in
  // which case they are used to playback old recordings and not the livestream.
  const isChildStream = stream && (stream.parentId || !stream.playbackId);
  if (isChildStream) {
    session = stream;
    stream = null;
  }

  if (stream) {
    let url: string;
    if (withRecordings) {
      ({ url } = await getRunningRecording(stream, req));
    }
    return newPlaybackInfo(
      "live",
      getHLSPlaybackUrl(ingest, stream),
      getWebRTCPlaybackUrl(ingest, stream),
      stream.playbackPolicy,
      null,
      stream.isActive ? 1 : 0,
      url,
      withRecordings,
      stream.record
    );
  }

  if (session) {
    const { recordingUrl } = await getRecordingFields(
      req.config,
      ingest,
      session,
      false
    );
    if (recordingUrl) {
      return newPlaybackInfo("recording", recordingUrl);
    }
  }

  return await getAttestationPlaybackInfo(
    req.config,
    ingest,
    id,
    req.user,
    cutoffDate
  );
}

const app = Router();

app.get("/:id", async (req, res) => {
  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }
  const ingest = ingests[0].base;

  let { id } = req.params;
  const withRecordings = req.query.recordings === "true";

  const origin = req.headers["origin"] ?? "";
  const isEmbeddablePlayer = embeddablePlayerOrigin.test(origin);

  const info = await getPlaybackInfo(
    req,
    ingest,
    id,
    isEmbeddablePlayer,
    origin,
    withRecordings
  );
  if (!info) {
    throw new NotFoundError(`No playback URL found for ${id}`);
  }
  res.status(200).json(info);
});

export default app;
