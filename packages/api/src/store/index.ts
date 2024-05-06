import Model from "./model";
import { db, jobsDb, DB, PostgresParams } from "./db";

export { db, jobsDb };

// Helper function to start database and boot up legacy store
export default async function makeStore(
  dbParams: PostgresParams,
  jobsDbParams: PostgresParams
): Promise<[DB, DB, Model]> {
  await db.start(dbParams);
  await jobsDb.start(jobsDbParams);
  const store = new Model(db);
  return [db, jobsDb, store];
}
