import { Request, Router } from "express";
import { db } from "../store";
import {
  getHLSPlaybackUrl,
  getWebRTCPlaybackUrl,
  getRecordingFields,
  USER_SESSION_TIMEOUT,
} from "./stream";
import {
  getPlaybackUrl as assetPlaybackUrl,
  getStaticPlaybackInfo,
  StaticPlaybackInfo,
} from "./asset";
import { CliArgs } from "../parse-cli";
import { DBSession } from "../store/db";
import { Asset, Stream, User } from "../schema/types";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
import { NotFoundError, UnprocessableEntityError } from "../store/errors";

/**
 * CROSS_USER_ASSETS_CUTOFF_DATE represents the cut-off date for cross-account
 * asset playback. Assets created before this date can still be played by other
 * accounts by dStorage ID. Assets created after this date will not have
 * cross-account playback enabled, ensuring users are billed appropriately. This
 * was made for backward compatibiltiy during the Viewership V2 deploy.
 */
export const CROSS_USER_ASSETS_CUTOFF_DATE = new Date(2023, 5, 10).getTime();

var embeddablePlayerOrigin = /^https:\/\/(.+\.)?lvpr.tv$/;

// This should be compatible with the Mist format: https://gist.github.com/iameli/3e9d20c2b7f11365ea8785c5a8aa6aa6
type PlaybackInfo = {
  type: "live" | "vod" | "recording";
  meta: {
    live?: 0 | 1;
    playbackPolicy?: Asset["playbackPolicy"] | Stream["playbackPolicy"];
    source: {
      hrn: "HLS (TS)" | "MP4" | "WebRTC (H264)";
      type:
        | "html5/application/vnd.apple.mpegurl"
        | "html5/video/mp4"
        | "html5/video/h264";
      url: string;
      size?: number;
      width?: number;
      height?: number;
      bitrate?: number;
    }[];
  };
};

function newPlaybackInfo(
  type: PlaybackInfo["type"],
  hlsUrl: string,
  webRtcUrl?: string | null,
  playbackPolicy?: Asset["playbackPolicy"] | Stream["playbackPolicy"],
  staticFilesPlaybackInfo?: StaticPlaybackInfo[],
  live?: PlaybackInfo["meta"]["live"]
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

  const playbackUrl = assetPlaybackUrl(config, ingest, asset, os);

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
  isCrossUserQuery?: boolean
): Promise<{ stream?: DBStream; session?: DBSession; asset?: WithID<Asset> }> {
  const cutoffDate = isCrossUserQuery ? null : CROSS_USER_ASSETS_CUTOFF_DATE;
  let asset =
    (await db.asset.getByPlaybackId(id)) ??
    (await db.asset.getByIpfsCid(id, user, cutoffDate)) ??
    (await db.asset.getBySourceURL("ipfs://" + id, user, cutoffDate)) ??
    (await db.asset.getBySourceURL("ar://" + id, user, cutoffDate));

  if (asset && !asset.deleted) {
    if (asset.status.phase !== "ready") {
      throw new UnprocessableEntityError("asset is not ready for playback");
    }
    if (asset.userId !== user?.id && !isCrossUserQuery) {
      console.log(
        `Returning cross-user asset for playback. ` +
          `userId=${user?.id} userEmail=${user?.email} ` +
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

async function getPlaybackInfo(
  { config, user }: Request,
  ingest: string,
  id: string,
  isCrossUserQuery: boolean
): Promise<PlaybackInfo> {
  let { stream, asset, session } = await getResourceByPlaybackId(
    id,
    user,
    isCrossUserQuery
  );

  if (asset) {
    return await getAssetPlaybackInfo(config, ingest, asset);
  }

  // Streams represent "transcoding sessions" when they are a child stream, in
  // which case they are used to playback old recordings and not the livestream.
  const isChildStream = stream && (stream.parentId || !stream.playbackId);
  if (isChildStream) {
    session = stream;
    stream = null;
  }

  if (stream) {
    return newPlaybackInfo(
      "live",
      getHLSPlaybackUrl(ingest, stream),
      getWebRTCPlaybackUrl(ingest, stream),
      stream.playbackPolicy,
      null,
      stream.isActive ? 1 : 0
    );
  }

  if (session) {
    const { recordingUrl } = await getRecordingFields(
      config,
      ingest,
      session,
      false
    );
    if (recordingUrl) {
      return newPlaybackInfo("recording", recordingUrl);
    }
  }

  return null;
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
  const isEmbeddablePlayer = embeddablePlayerOrigin.test(
    req.headers["origin"] ?? ""
  );
  const info = await getPlaybackInfo(req, ingest, id, isEmbeddablePlayer);
  if (!info) {
    throw new NotFoundError(`No playback URL found for ${id}`);
  }
  res.status(200).json(info);
});

export default app;
