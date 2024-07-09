import { DB, PostgresParams, db, jobsDb } from "./db";
import Model from "./model";

export { db, jobsDb };

// Helper function to start database and boot up legacy store
export default async function makeStore(
  dbParams: PostgresParams,
  jobsDbParams: PostgresParams,
): Promise<[DB, DB, Model]> {
  await db.start(dbParams);
  await jobsDb.start({ ...jobsDbParams, createTablesOnDb: false });
  const store = new Model(db);
  return [db, jobsDb, store];
}
