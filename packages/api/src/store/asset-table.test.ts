import setupPromise from "../test-server";
import db from "./db";

beforeAll(async () => {
  await setupPromise;
});

describe("assets table", () => {
  it("should create all indexes defined in the schema", async () => {
    const res = await db.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'asset' AND indexname != 'asset_pkey'"
    );
    const indexes = res.rows?.map((r: any) => r.indexname).sort();
    expect(indexes).toEqual([
      "asset_creatorId_value",
      "asset_id",
      "asset_playbackId",
      "asset_playbackRecordingId",
      "asset_sourceAssetId",
      "asset_source_sessionId",
      "asset_source_url",
      "asset_storage_ipfs_cid",
      "asset_storage_ipfs_nftMetadata_cid",
      "asset_userId",
    ]);
  });
});
