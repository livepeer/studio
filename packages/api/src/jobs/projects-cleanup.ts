import sql from "sql-template-strings";
import { initClients } from "../app-router";
import { CliArgs } from "../parse-cli";
import { DB } from "../store/db";
import Queue from "../store/queue";
import { triggerCleanUpProjectsJob } from "../controllers/project";
import { Request } from "express";

// queries for all the deleted projects
// clean up logic for all related assets and streams
export default async function projectsCleanup(
  config: CliArgs,
  req: Request,
  clients?: { jobsDb: DB },
) {
  if (!config.ingest?.length) {
    throw new Error("ingest not configured");
  }
  const { jobsDb } =
    clients ?? (await initClients(config, "projects-cleanup-job"));
  const { projectsCleanupLimit: limit, ingest } = config;

  let [projects] = await jobsDb.stream.find([sql`data->>'deleted' = 'true'`], {
    limit,
    order: "data->>'lastSeen' DESC",
  });

  const [cleanedUp, jobPromise] = triggerCleanUpProjectsJob(projects, req);
  await jobPromise;

  return {
    cleanedUp,
    logContext: `limit=${limit} numCleanedUp=${cleanedUp.length}`,
  };
}
