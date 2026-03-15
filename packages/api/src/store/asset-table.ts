import sql, { SQLStatement } from "sql-template-strings";
import { Asset, Task, User } from "../schema/types";
import Table from "./table";
import { QueryOptions, WithID } from "./types";

export const taskOutputToIpfsStorage = (
  out: Task["output"]["export"]["ipfs"],
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
    opts?: QueryOptions,
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

  async getByIpfsCid(
    cid: string,
    user?: User,
    crossUserCutoffDate?: number,
  ): Promise<WithID<Asset>> {
    return this.findFirstReady(
      [sql`asset.data->'storage'->'ipfs'->>'cid' = ${cid}`],
      user,
      crossUserCutoffDate,
    );
  }

  async getBySourceURL(
    url: string,
    user?: User,
    crossUserCutoffDate?: number,
  ): Promise<WithID<Asset>> {
    return this.findFirstReady(
      [
        sql`asset.data->'source'->>'type' = 'url'`,
        sql`asset.data->'source'->>'url' = ${url}`,
        sql`asset.data->'source'->>'encryption' IS NULL`,
      ],
      user,
      crossUserCutoffDate,
    );
  }

  private async findFirstReady(
    query: SQLStatement[],
    user?: User,
    crossUserCutoffDate?: number,
  ): Promise<WithID<Asset>> {
    const findOnce = async (userQuery: SQLStatement[]) => {
      const [assets] = await this.find(
        [
          ...query,
          ...userQuery,
          sql`asset.data->>'deleted' IS NULL`,
          sql`asset.data->'status'->>'phase' = 'ready'`,
        ],
        {
          limit: 1,
          order: "coalesce((asset.data->'createdAt')::bigint, 0) ASC",
        },
      );
      return assets.length > 0 ? assets[0] : null;
    };

    if (user) {
      const asset = await findOnce([sql`asset.data->>'userId' = ${user.id}`]);
      if (asset) {
        return asset;
      }
    }

    return !crossUserCutoffDate
      ? findOnce([])
      : findOnce([
          sql`coalesce((asset.data->'createdAt')::bigint, 0) < ${crossUserCutoffDate}`,
        ]);
  }

  async getBySessionId(sessionId: string): Promise<WithID<Asset>> {
    const query = [
      sql`asset.data->'source'->>'type' = 'recording'`,
      sql`asset.data->'source'->>'sessionId' = ${sessionId}`,
    ];
    const [assets] = await this.find(query, {
      limit: 1,
    });
    if (assets.length < 1) {
      return null;
    }
    return assets[0];
  }

  async findDuplicateUrlUpload(
    url: string,
    user: User,
    projectId: string,
  ): Promise<WithID<Asset>> {
    const query = [
      sql`asset.data->>'deleted' IS NULL`,
      sql`asset.data->>'userId' = ${user.id}`,
      sql`coalesce(asset.data->>'projectId', ${
        user.defaultProjectId || ""
      }) = ${projectId || ""}`,
      sql`asset.data->'source'->>'type' = 'url'`,
      sql`asset.data->'source'->>'url' = ${url}`,
      sql`asset.data->'status'->>'phase' IN ('waiting', 'processing', 'ready')`,
    ];

    const [assets] = await this.find(query, { limit: 1 });
    return assets?.length > 0 ? assets[0] : null;
  }
}
