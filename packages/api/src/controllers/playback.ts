import { Router } from "express";
import { db } from "../store";
import {
  getPlaybackUrl as streamPlaybackUrl,
  getRecordingUrl as recordingPlaybackUrl,
} from "./stream";
import { getPlaybackUrl as assetPlaybackUrl } from "./asset";
import { NotFoundError } from "@cloudflare/kv-asset-handler";

// This should be compatible with the Mist format: https://gist.github.com/iameli/3e9d20c2b7f11365ea8785c5a8aa6aa6
type PlaybackInfo = {
  type: "live" | "vod" | "recording";
  meta: {
    live?: 0 | 1;
    source: {
      // the only supported format is HLS for now
      hrn: "HLS (TS)";
      type: "html5/application/vnd.apple.mpegurl";
      url: string;
    }[];
  };
};

const newPlaybackInfo = (
  type: PlaybackInfo["type"],
  hlsUrl: string,
  live?: PlaybackInfo["meta"]["live"]
): PlaybackInfo => ({
  type,
  meta: {
    live,
    source: [
      {
        hrn: "HLS (TS)",
        type: "html5/application/vnd.apple.mpegurl",
        url: hlsUrl,
      },
    ],
  },
});

async function getPlaybackInfo(
  ingest: string,
  id: string
): Promise<PlaybackInfo> {
  const stream = await db.stream.getByPlaybackId(id);
  if (stream && !stream.deleted) {
    return newPlaybackInfo(
      "live",
      streamPlaybackUrl(ingest, stream),
      stream.isActive ? 1 : 0
    );
  }
  const asset = await db.asset.getByPlaybackId(id);
  if (asset && !asset.deleted) {
    return newPlaybackInfo("vod", assetPlaybackUrl(ingest, asset));
  }
  const session = (await db.session.get(id)) ?? (await db.stream.get(id));
  if (session?.record && !session.deleted) {
    return newPlaybackInfo("recording", recordingPlaybackUrl(ingest, session));
  }
  throw new NotFoundError(`No playback URL found for ${id}`);
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
  const info = await getPlaybackInfo(ingest, id);
  res.status(200).json(info);
});

export default app;
