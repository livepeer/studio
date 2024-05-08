import { initClients } from "../app-router";
import { CliArgs } from "../parse-cli";

export default async function createDbTables(config: CliArgs) {
  const startTime = process.hrtime();

  await initClients(
    { ...config, createDbTables: true },
    "create-db-tables-job"
  );

  const elapsedTime = process.hrtime(startTime);
  const elapsedTimeSec = elapsedTime[0] + elapsedTime[1] / 1e9;
  console.log(`Ran create-db-tables job. elapsedTime=${elapsedTimeSec}s`);
}
