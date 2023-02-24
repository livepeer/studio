import express, { Router } from "express";
import "express-async-errors"; // it monkeypatches, i guess
import morgan from "morgan";
import { db } from "../../store";
import { healthCheck } from "../../middleware";
import logger from "../../logger";
import { Stream } from "../../schema/types";
import fetch from "node-fetch";
import { hostname } from "os";

import {
  StatusResponse,
  MasterPlaylist,
  MasterPlaylistDictionary,
} from "./livepeer-types";
import { DBStream } from "../../store/stream-table";

const pollInterval = 2 * 1000; // 2s
const updateInterval = 60 * 1000; // 60s
const deleteTimeout = 30 * 1000; // 30s
const seenSegmentsTimeout = 2 * 60 * 1000; // 2m. should be at least two time longer than HTTP push timeout in go-livepeer

async function makeRouter(params) {
  const bodyParser = require("body-parser");

  // Logging, JSON parsing, store injection

  const app = Router();
  app.use(healthCheck);
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.config = params;
    next();
  });

  // If we throw any errors with numerical statuses, use them.
  app.use(async (err, req, res, next) => {
    if (typeof err.status === "number") {
      res.status(err.status);
      return res.json({ errors: [err.message] });
    }

    next(err);
  });

  return {
    router: app,
  };
}

// counts segment in the playlist
function countSegments(si: streamInfo, mpl: MasterPlaylist) {
  if (!mpl.Variants) {
    return;
  }
  mpl.Variants.forEach((variant, i) => {
    // console.log(`${i}th variant: `, variant)
    // console.log(`segments num: `, variant?.Chunklist?.Segments?.length)
    // console.log(`segments: `, variant?.Chunklist?.Segments)
    for (const segment of variant?.Chunklist?.Segments || []) {
      if (!segment) {
        continue;
      }
      // console.log(`segment ${segment.SeqId} :`, segment)
      const segId = `${i}_${segment.SeqId}`;
      if (!si.seenSegments.has(segId)) {
        si.seenSegments.set(segId, new Date());
        if (i === 0) {
          si.sourceSegments++;
          if (segment.Duration > 0) {
            si.sourceSegmentsDuration += segment.Duration;
          }
        } else {
          si.transcodedSegments++;
          if (segment.Duration > 0) {
            si.transcodedSegmentsDuration += segment.Duration;
          }
        }
      }
    }
    const now = Date.now();
    for (const [segId, d] of si.seenSegments) {
      if (now - d.valueOf() > seenSegmentsTimeout) {
        si.seenSegments.delete(segId);
      }
    }
  });
}

interface streamInfo {
  mid: string;
  stream?: DBStream;

  lastSeen: Date;
  lastSeenSavedToDb: Date;
  lastUpdated: Date;
  sourceSegments: number;
  transcodedSegments: number;
  sourceSegmentsDuration: number;
  transcodedSegmentsDuration: number;
  sourceSegmentsLastUpdated: number;
  transcodedSegmentsLastUpdated: number;
  sourceSegmentsDurationLastUpdated: number;
  transcodedSegmentsDurationLastUpdated: number;
  seenSegments: Map<string, Date>;
  sourceBytes: number;
  transcodedBytes: number;
  ingestRate: number;
  outgoingRate: number;
  sourceBytesLastUpdated: number;
  transcodedBytesLastUpdated: number;
}

function newStreamInfo(mid: string, stream?: DBStream): streamInfo {
  const now = new Date();
  return {
    mid,
    stream,
    lastSeen: now,
    lastSeenSavedToDb: now,
    lastUpdated: now,
    sourceSegments: 0,
    transcodedSegments: 0,
    sourceSegmentsDuration: 0.0,
    transcodedSegmentsDuration: 0.0,
    sourceSegmentsLastUpdated: 0,
    transcodedSegmentsLastUpdated: 0,
    sourceSegmentsDurationLastUpdated: 0.0,
    transcodedSegmentsDurationLastUpdated: 0.0,
    sourceBytes: 0,
    transcodedBytes: 0,
    sourceBytesLastUpdated: 0,
    transcodedBytesLastUpdated: 0,
    ingestRate: 0.0,
    outgoingRate: 0.0,
    seenSegments: new Map(),
  };
}

class statusPoller {
  readonly broadcaster: string;
  readonly region: string;
  readonly hostname: string;
  readonly pid: NodeJS.Timeout;

  private readonly seenStreams: Map<string, streamInfo>;

  constructor(broadcaster: string, region: string) {
    this.broadcaster = broadcaster;
    this.region = region;
    this.hostname = hostname();
    this.seenStreams = new Map<string, streamInfo>();
    this.pid = setInterval(this.pollStatus.bind(this), pollInterval);
  }

  public async stop() {
    clearInterval(this.pid);
    await this.housekeepSeenStreams(null, true);
  }

  private async pollStatus() {
    // console.log(`Polling b ${this.broadcaster} `)
    let status;
    try {
      status = await this.getStatus(this.broadcaster);
    } catch (e) {
      if (e.code !== "ECONNREFUSED") {
        console.log(`got error fetch status: `, e);
      }
      return;
    }
    // console.log(`got status: `, status)
    const playback2session = new Map<string, string>();
    for (const k of Object.keys(status.InternalManifests || {})) {
      playback2session.set(status.InternalManifests[k], k);
    }
    const getStreamObject = async (mid: string) => {
      const sid = playback2session.has(mid) ? playback2session.get(mid) : mid;
      let storedInfo: DBStream | null = await db.stream.get(sid);
      if (!storedInfo) {
        const [objs, _] = await db.stream.find({ playbackId: mid });
        if (objs?.length) {
          storedInfo = objs[0];
        }
      }
      return storedInfo;
    };
    const now = new Date();
    for (const mid of Object.keys(status.Manifests)) {
      let si,
        timeSinceLastSeen = 0,
        needUpdate = false;
      if (!this.seenStreams.has(mid)) {
        // new stream
        // console.log(`got new stream ${mid}`)
        const stream = await getStreamObject(mid);
        si = newStreamInfo(mid, stream);
        this.seenStreams.set(mid, si);
        needUpdate = true;
      } else {
        si = this.seenStreams.get(mid);
        needUpdate = now.valueOf() - si.lastUpdated.valueOf() > updateInterval;
        timeSinceLastSeen = (now.valueOf() - si.lastSeen.valueOf()) / 1000;
        si.lastSeen = now;
      }
      if (mid in (status.StreamInfo || {})) {
        const statusStreamInfo = status.StreamInfo[mid];
        if (
          si.sourceBytes > 0 &&
          statusStreamInfo.SourceBytes > si.sourceBytes &&
          timeSinceLastSeen > 0
        ) {
          si.ingestRate =
            (statusStreamInfo.SourceBytes - si.sourceBytes) / timeSinceLastSeen;
        }
        if (
          si.transcodedBytes > 0 &&
          statusStreamInfo.TranscodedBytes > si.transcodedBytes &&
          timeSinceLastSeen > 0
        ) {
          si.outgoingRate =
            (statusStreamInfo.TranscodedBytes - si.transcodedBytes) /
            timeSinceLastSeen;
        }
        si.sourceBytes = statusStreamInfo.SourceBytes;
        si.transcodedBytes = statusStreamInfo.TranscodedBytes;
      }
      const manifest = status.Manifests[mid];
      countSegments(si, manifest);
      if (needUpdate) {
        try {
          await this.flushStreamMetrics(si, playback2session.has(mid));
        } catch (err) {
          console.log(`error flushing stream metrics: mid=${mid}, err=`, err);
        }
      }
    }
    await this.housekeepSeenStreams(status.Manifests);
  }

  private async getStatus(broadcaster: string): Promise<StatusResponse> {
    const uri = `http://${broadcaster}/status`;
    const result = await fetch(uri);
    const json = await result.json();
    return json;
  }

  private async housekeepSeenStreams(
    activeStreams?: MasterPlaylistDictionary,
    force?: boolean
  ) {
    for (const [mid, si] of this.seenStreams) {
      if (activeStreams && mid in activeStreams) {
        // active streams are already processed in the code calling this
        continue;
      }

      const now = Date.now();
      const needUpdate =
        (force || now.valueOf() - si.lastUpdated.valueOf() > updateInterval) &&
        si.lastSeen !== si.lastSeenSavedToDb;
      const shouldDelete = now - si.lastSeen.valueOf() > deleteTimeout;
      if (needUpdate || shouldDelete) {
        try {
          await this.flushStreamMetrics(si, !!si.stream.parentId);
        } catch (err) {
          console.log(`error flushing stream metrics: mid=${mid}, err=`, err);
        }
      }
      if (shouldDelete) {
        this.seenStreams.delete(mid);
        const storedInfo = si.stream;
        if (storedInfo) {
          const zeroRate = {
            ingestRate: 0,
            outgoingRate: 0,
          } as Stream;
          await db.stream.update(storedInfo.id, zeroRate);
          if (storedInfo.parentId) {
            await db.stream.update(storedInfo.parentId, zeroRate);
            await db.session.update(storedInfo.id, zeroRate);
          }
          if (!storedInfo.parentId) {
            // this is not a session created by our Mist, so manage isActive field for this stream
            await db.stream.setActiveToFalse({
              id: storedInfo.id,
              lastSeen: si.lastSeenSavedToDb.valueOf(),
            });
          }
        }
      }
      // console.log(`seen: `, this.seenStreams)
    }
  }

  private async flushStreamMetrics(si: streamInfo, hasSession?: boolean) {
    const storedInfo = si.stream;
    if (!storedInfo) {
      return;
    }

    const setObj = {
      lastSeen: si.lastSeen.valueOf(),
      ingestRate: si.ingestRate,
      outgoingRate: si.outgoingRate,
      broadcasterHost: this.hostname,
    } as Stream;
    const incObj = {
      sourceSegments: si.sourceSegments - si.sourceSegmentsLastUpdated,
      transcodedSegments:
        si.transcodedSegments - si.transcodedSegmentsLastUpdated,
      sourceSegmentsDuration:
        si.sourceSegmentsDuration - si.sourceSegmentsDurationLastUpdated,
      transcodedSegmentsDuration:
        si.transcodedSegmentsDuration -
        si.transcodedSegmentsDurationLastUpdated,
      sourceBytes: si.sourceBytes - si.sourceBytesLastUpdated,
      transcodedBytes: si.transcodedBytes - si.transcodedBytesLastUpdated,
    };
    const lastSavedUpdates: Partial<streamInfo> = {
      lastSeenSavedToDb: si.lastSeen,
      sourceSegmentsLastUpdated: si.sourceSegments,
      transcodedSegmentsLastUpdated: si.transcodedSegments,
      sourceSegmentsDurationLastUpdated: si.sourceSegmentsDuration,
      transcodedSegmentsDurationLastUpdated: si.transcodedSegmentsDuration,
      sourceBytesLastUpdated: si.sourceBytes,
      transcodedBytesLastUpdated: si.transcodedBytes,
    };
    if (!storedInfo.parentId && hasSession !== undefined && !hasSession) {
      // this is not a session created by our Mist, so manage isActive field for this stream
      setObj.isActive = true;
      setObj.region = this.region;
    }
    // console.log(`---> setting`, setObj)
    // console.log(`---> inc`, incObj)
    await db.stream.add(storedInfo.id, incObj, setObj);
    if (storedInfo.parentId) {
      await db.stream.add(storedInfo.parentId, incObj, setObj);
      // update session table
      try {
        await db.session.add(storedInfo.id, incObj, setObj);
      } catch (e) {
        console.log(`error updating session table:`, e);
      }
    }
    si.lastUpdated = new Date();
    Object.assign(si, lastSavedUpdates);
  }
}

export default async function makeApp(params) {
  const { port, postgresUrl, ownRegion, listen = true, broadcaster } = params;
  // Storage init
  await db.start({ postgresUrl, appName: "stream-info" });

  const { router } = await makeRouter(params);
  const app = express();
  app.use(morgan("dev"));
  app.use(router);

  let listener;
  let listenPort;

  if (listen) {
    await new Promise<void>((resolve, reject) => {
      listener = app
        .listen(port, () => {
          listenPort = listener.address().port;
          logger.info(`API server listening on http://0.0.0.0:${listenPort}`);
          resolve();
        })
        .on("error", (err) => {
          logger.error("Error starting server", err);
          reject(err);
        });
    });
  }

  const poller = new statusPoller(broadcaster, ownRegion);

  const close = async () => {
    process.off("SIGTERM", sigterm);
    process.off("SIGINT", sigterm);
    process.off("unhandledRejection", unhandledRejection);
    await poller.stop();
    listener.close();
    await db.close();
  };

  // Handle SIGTERM gracefully. It's polite, and Kubernetes likes it.
  const sigterm = handleSigterm(close);

  process.on("SIGTERM", sigterm);
  process.on("SIGINT", sigterm);

  const unhandledRejection = (err) => {
    logger.error("fatal, unhandled promise rejection: ", err);
    err.stack && logger.error(err.stack);
    sigterm("REJECT");
  };
  process.on("unhandledRejection", unhandledRejection);

  return {
    ...params,
    app,
    listener,
    port: listenPort,
    close,
  };
}

const handleSigterm = (close) => async (signal) => {
  // Handle SIGTERM gracefully. It's polite, and Kubernetes likes it.
  logger.info(`Got ${signal}. Graceful shutdown start`);
  let timeout = setTimeout(() => {
    logger.warn("Didn't gracefully exit in 15s, forcing");
    process.exit(1);
  }, 15000);
  try {
    await close();
  } catch (err) {
    logger.error("Error closing database", err);
    process.exit(1);
  }
  clearTimeout(timeout);
  logger.info("Graceful shutdown complete, exiting cleanly");
  process.exit(0);
};
