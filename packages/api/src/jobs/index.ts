import logger from "../logger";
import { CliArgs, JobType } from "../parse-cli";
import { timeout } from "../util";
import activeCleanup from "./active-cleanup";
import createDbTables from "./create-db-tables";
import updateUsage from "./update-usage";

type JobFunc = (config: CliArgs) => Promise<void | { logContext?: string }>;

export const jobFuncs: Record<JobType, JobFunc> = {
  "active-cleanup": activeCleanup,
  "create-db-tables": createDbTables,
  "update-usage": updateUsage,
};

export async function runJob(jobName: JobType, config: CliArgs): Promise<void> {
  const startTime = process.hrtime();

  logger.info(`Starting job. job=${jobName}`);
  try {
    const result = await timeout(config.jobTimeoutSec * 1000, () =>
      jobFuncs[jobName](config),
    );

    const elapsedTime = process.hrtime(startTime);
    const elapsedTimeSec = elapsedTime[0] + elapsedTime[1] / 1e9;

    const logCtx = result && result.logContext;
    logger.info(
      `Ran job successfully. job=${jobName} time=${elapsedTimeSec}s ${logCtx}`,
    );
    process.exit(0);
  } catch (error) {
    logger.error(
      `Job failed. job=${jobName} error=${JSON.stringify(
        error.message || error,
      )} stack=${JSON.stringify(error.stack)}`,
    );
    process.exit(1);
  }
}
