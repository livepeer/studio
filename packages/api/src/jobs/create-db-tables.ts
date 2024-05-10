import { initClients } from "../app-router";
import { CliArgs } from "../parse-cli";

export default async function createDbTables(config: CliArgs) {
  await initClients(
    { ...config, createDbTables: true },
    "create-db-tables-job"
  );
}
