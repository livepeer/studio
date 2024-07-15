import { initDb } from "../app-router";
import { CliArgs } from "../parse-cli";

export default async function createDbTables(config: CliArgs) {
  await initDb(
    { ...config, postgresCreateTables: true },
    "create-db-tables-job"
  );
}
