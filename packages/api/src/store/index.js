import Model from "./model";
import db from "./db";

export { db };

// Helper function to start database and boot up legacy store
export default async function makeStore(params) {
  await db.start(params);
  const store = new Model(db);
  return [db, store];
}
