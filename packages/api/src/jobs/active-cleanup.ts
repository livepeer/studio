import sql from "sql-template-strings";
import { initClients } from "../app-router";
import {
  ACTIVE_TIMEOUT,
  triggerCleanUpIsActiveJob,
} from "../controllers/stream";
import { CliArgs } from "../parse-cli";
import { DB } from "../store/db";
import Queue from "../store/queue";

// queries for all the streams with active clean up pending and triggers the
// clean up logic for them.
export default async function activeCleanup(
  config: CliArgs,
  clients?: { jobsDb: DB; queue: Queue }
) {
  if (!config.ingest?.length) {
    throw new Error("ingest not configured");
  }
  const { jobsDb, queue } =
    clients ?? (await initClients(config, "active-cleanup-job"));
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

  return {
    cleanedUp,
    logContext: `limit=${limit} numCleanedUp=${cleanedUp.length}`,
  };
}
