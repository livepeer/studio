import sql from "sql-template-strings";
import { initClients } from "../app-router";
import {
  ACTIVE_TIMEOUT,
  triggerCleanUpIsActiveJob,
} from "../controllers/stream";
import logger from "../logger";
import { CliArgs } from "../parse-cli";

// queries for all the streams with active clean up pending and triggers the
// clean up logic for them.
export default async function runActiveCleanup(config: CliArgs) {
  const startTime = process.hrtime();
  if (!config.ingest?.length) {
    throw new Error("ingest not configured");
  }
  const { jobsDb, queue } = await initClients(config, "active-cleanup-job");
  const { activeCleanupLimit: limit, ingest } = config;

  const activeThreshold = Date.now() - ACTIVE_TIMEOUT;
  let [streams] = await jobsDb.stream.find(
    [
      sql`data->>'isActive' = 'true'`,
      sql`(data->>'lastSeen')::bigint < ${activeThreshold}`,
    ],
    {
      limit,
      order: "data->>'lastSeen' DESC",
    }
  );

  const [cleanedUp, jobPromise] = triggerCleanUpIsActiveJob(
    config,
    streams,
    queue,
    ingest[0].base
  );
  await jobPromise;

  const elapsedTime = process.hrtime(startTime);
  const elapsedTimeSec = elapsedTime[0] + elapsedTime[1] / 1e9;
  logger.info(
    `Ran active-cleanup job. elapsedTime=${elapsedTimeSec}s limit=${limit} numCleanedUp=${cleanedUp.length}`
  );
}
