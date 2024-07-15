import setupPromise from "../test-server";
import { db } from ".";

beforeAll(async () => {
  await setupPromise;
});

describe("experiment table", () => {
  it("should create all indexes defined in the schema", async () => {
    const res = await db.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'experiment' AND indexname != 'experiment_pkey'"
    );
    const indexes = res.rows?.map((r: any) => r.indexname).sort();
    expect(indexes).toEqual([
      "experiment_audienceUserIds",
      "experiment_name",
      "experiment_userId",
    ]);
  });

  it("should use index to search for experiment audience", async () => {
    const res = await db.query(
      "EXPLAIN SELECT * FROM experiment WHERE data->'audienceUserIds' @> '123456'"
    );
    const result = JSON.stringify(res.rows);
    expect(result).toContain(`Index Scan on \\"experiment_audienceUserIds\\"`);
    expect(result).toContain(
      `Index Cond: ((data -> 'audienceUserIds'::text) @> '123456'::jsonb)`
    );
  });
});
