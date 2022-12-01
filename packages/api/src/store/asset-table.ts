import sql from "sql-template-strings";
import { Asset, Task } from "../schema/types";
import Table from "./table";
import { FindOptions, QueryOptions, WithID } from "./types";

export const taskOutputToIpfsStorage = (
  out: Task["output"]["export"]["ipfs"]
): Omit<Asset["storage"]["ipfs"], "spec"> =>
  !out
    ? null
    : {
        cid: out.videoFileCid,
        url: out.videoFileUrl,
        gatewayUrl: out.videoFileGatewayUrl,
        nftMetadata: !out.nftMetadataCid
          ? undefined
          : {
              cid: out.nftMetadataCid,
              url: out.nftMetadataUrl,
              gatewayUrl: out.nftMetadataGatewayUrl,
            },
      };

export default class AssetTable extends Table<WithID<Asset>> {
  async getByPlaybackId(
    playbackId: string,
    opts?: QueryOptions
  ): Promise<WithID<Asset>> {
    const query = [
      sql`asset.data->>'playbackId' = ${playbackId}`,
      sql`asset.data->>'deleted' IS NULL`,
    ];
    const [assets] = await this.find(query, {
      ...opts,
      limit: 2,
    });
    if (assets.length < 1) {
      return null;
    }
    return assets[0];
  }

  async getByIpfsCid(cid: string): Promise<WithID<Asset>> {
    const query = [
      sql`asset.data->'storage'->'ipfs'->>'cid' = ${cid}`,
      sql`asset.data->>'deleted' IS NULL`,
    ];
    const [assets] = await this.find(query, {
      limit: 2,
      order: "coalesce((asset.data->'createdAt')::bigint, 0) ASC",
    });
    if (!assets || assets.length < 1) {
      return null;
    }
    return assets[0];
  }

  async getBySourceURL(url: string): Promise<WithID<Asset>> {
    const query = [
      sql`asset.data->'source'->>'type' = 'url'`,
      sql`asset.data->'source'->>'url' = ${url}`,
      sql`asset.data->>'deleted' IS NULL`,
      sql`asset.data->'status'->>'phase' = 'ready'`,
    ];
    const [assets] = await this.find(query, {
      limit: 2,
      order: "coalesce((asset.data->'createdAt')::bigint, 0) ASC",
    });
    if (!assets || assets.length < 1) {
      return null;
    }
    return assets[0];
  }

  async findRecentDuplicateAssets(
    url: string,
    userId: string,
    createdAfter: number,
    opts: FindOptions = { limit: 10 }
  ): Promise<[WithID<Asset>[], string]> {
    const query = [
      sql`asset.data->'source'->>'type' = 'url'`,
      sql`asset.data->>'deleted' IS NULL`,
      sql`asset.data->'status'->>'phase' IN ('waiting', 'pending')`,
      sql`asset.data->'userId' = ${userId}`,
      sql`asset.data->'source'->>'url' = ${url}`,
      sql`coalesce((asset.data->'createdAt')::bigint, 0) > ${createdAfter}`,
    ];
    return this.find(query, {
      order: "coalesce((asset.data->'createdAt')::bigint, 0) DESC",
      ...opts,
    });
  }
}
