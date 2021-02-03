import express, { Router } from "express";
import "express-async-errors"; // it monkeypatches, i guess
import morgan from "morgan";
import { db } from "../../store";
import { DB } from "../../store/db";
import { healthCheck } from "../../middleware";
import logger from "../../logger";
import { Stream } from "../../schema/types";
import fetch from "isomorphic-fetch";

import { StatusResponse, MasterPlaylist } from "./livepeer-types";

const pollInterval = 2 * 1000;
const updateInterval = 2 * 1000;
const deleteTimeout = 5 * 60 * 1000;
const seenSegmentsTimeout = 60 * 1000;

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
  lastSeen: Date;
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
}

function newStreamInfo(): streamInfo {
  return {
    lastSeen: new Date(),
    lastUpdated: new Date(),
    sourceSegments: 0,
    transcodedSegments: 0,
    sourceSegmentsDuration: 0.0,
    transcodedSegmentsDuration: 0.0,
    sourceSegmentsLastUpdated: 0,
    transcodedSegmentsLastUpdated: 0,
    sourceSegmentsDurationLastUpdated: 0.0,
    transcodedSegmentsDurationLastUpdated: 0.0,
    seenSegments: new Map(),
  };
}

class statusPoller {
  broadcaster: string;

  private seenStreams: Map<string, streamInfo>;

  constructor(broadcaster: string) {
    this.broadcaster = broadcaster;
    this.seenStreams = new Map<string, streamInfo>();
  }

  private async pollStatus() {
    // console.log(`Polling b ${this.broadcaster} store ${this.store}`)
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
    for (const mid of Object.keys(status.Manifests)) {
      let si,
        needUpdate = false;
      if (!this.seenStreams.has(mid)) {
        // new stream
        // console.log(`got new stream ${mid}`)
        si = newStreamInfo();
        this.seenStreams.set(mid, si);
        needUpdate = true;
      } else {
        si = this.seenStreams.get(mid);
        needUpdate = Date.now() - si.lastUpdated.valueOf() > updateInterval;
        si.lastSeen = new Date();
      }
      const manifest = status.Manifests[mid];
      countSegments(si, manifest);
      if (needUpdate) {
        const sid = playback2session.has(mid) ? playback2session.get(mid) : mid;
        let storedInfo: Stream = await db.stream.get(sid);
        if (!storedInfo) {
          const [objs, _] = await db.stream.find({ playbackId: mid });
          if (objs?.length) {
            storedInfo = objs[0];
          }
        }
        // console.log(`got stream info from store: `, storedInfo)
        if (storedInfo) {
          await db.stream.update(storedInfo.id, {
            lastSeen: si.lastSeen.valueOf(),
          } as Stream);
          const incObj = {
            sourceSegments: si.sourceSegments - si.sourceSegmentsLastUpdated,
            transcodedSegments:
              si.transcodedSegments - si.transcodedSegmentsLastUpdated,
            sourceSegmentsDuration:
              si.sourceSegmentsDuration - si.sourceSegmentsDurationLastUpdated,
            transcodedSegmentsDuration:
              si.transcodedSegmentsDuration -
              si.transcodedSegmentsDurationLastUpdated,
          };
          await db.stream.add(storedInfo.id, incObj as Stream);
          if (storedInfo.parentId) {
            await db.stream.add(storedInfo.parentId, incObj as Stream);
            await db.stream.update(storedInfo.parentId, {
              lastSeen: si.lastSeen.valueOf(),
            } as Stream);
          }
          si.lastUpdated = new Date();
          si.sourceSegmentsLastUpdated = si.sourceSegments;
          si.transcodedSegmentsLastUpdated = si.transcodedSegments;
          si.sourceSegmentsDurationLastUpdated = si.sourceSegmentsDuration;
          si.transcodedSegmentsDurationLastUpdated =
            si.transcodedSegmentsDuration;
        }
      }
    }
    for (const [mid, si] of this.seenStreams) {
      const now = Date.now();
      if (!(mid in status.Manifests)) {
        const notSeenFor: number = now - si.lastSeen.valueOf();
        if (notSeenFor > deleteTimeout) {
          this.seenStreams.delete(mid);
        }
      }
    }
    // console.log(`seen: `, this.seenStreams)
  }

  private async getStatus(broadcaster: string): Promise<StatusResponse> {
    const uri = `http://${broadcaster}/status`;
    const result = await fetch(uri);
    const json = await result.json();
    return json;
  }

  startPoller() {
    const pid = setInterval(this.pollStatus.bind(this), pollInterval);
    return pid;
  }
}

export default async function makeApp(params) {
  const {
    storage,
    dbPath,
    port,
    host,
    postgresUrl,
    cloudflareNamespace,
    cloudflareAccount,
    cloudflareAuth,
    listen = true,
    broadcaster,
  } = params;
  // Storage init
  await db.start({ postgresUrl, postgresReplicaUrl: undefined });

  const { router } = await makeRouter(params);
  const app = express();
  app.use(morgan("dev"));
  app.use(router);

  let listener;
  let listenPort;

  if (listen) {
    await new Promise((resolve, reject) => {
      listener = app.listen(port, (err) => {
        if (err) {
          logger.error("Error starting server", err);
          return reject(err);
        }
        listenPort = listener.address().port;
        logger.info(`API server listening on http://0.0.0.0:${listenPort}`);
        resolve();
      });
    });
  }

  const poller = new statusPoller(broadcaster);
  const pid = poller.startPoller();

  const close = async () => {
    clearInterval(pid);
    process.off("SIGTERM", sigterm);
    process.off("unhandledRejection", unhandledRejection);
    listener.close();
    await db.close();
  };

  // Handle SIGTERM gracefully. It's polite, and Kubernetes likes it.
  const sigterm = handleSigterm(close);

  process.on("SIGTERM", sigterm);

  const unhandledRejection = (err) => {
    logger.error("fatal, unhandled promise rejection: ", err);
    err.stack && logger.error(err.stack);
    sigterm();
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

const handleSigterm = (close) => async () => {
  // Handle SIGTERM gracefully. It's polite, and Kubernetes likes it.
  logger.info("Got SIGTERM. Graceful shutdown start");
  let timeout = setTimeout(() => {
    logger.warn("Didn't gracefully exit in 5s, forcing");
    process.exit(1);
  }, 5000);
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
