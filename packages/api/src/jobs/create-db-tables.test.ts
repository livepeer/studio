import { db } from "../store";
import params from "../test-params";
import createDbTables from "./create-db-tables";

describe("create-db-tables", () => {
  it("should create tables and indexes in the DB", async () => {
    // make sure it forces the creation of the tables, even with a bad config
    await createDbTables({ ...params, postgresCreateTables: false });

    const res = await db.query(
      "SELECT indexname FROM pg_indexes WHERE indexname NOT LIKE '%_pkey'",
    );
    const indexes = res.rows?.map((r: any) => r.indexname).sort();

    // test just a couple indexes from each table or this would be too long
    const testIndexes = [
      "stream_isActive",
      "task_inputAssetId",
      "users_email",
      "webhook_log_userId",
      "session_parentId",
      "asset_source_url",
      "api_token_projectId",
    ];
    for (const index of testIndexes) {
      expect(indexes).toContain(index);
    }
  });
});
