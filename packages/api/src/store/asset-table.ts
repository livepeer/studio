import _ from "lodash";
import { QueryResult } from "pg";
import sql, { SQLStatement } from "sql-template-strings";
import { Asset, Task } from "../schema/types";
import Table from "./table";
import {
  DBLegacyObject,
  FindOptions,
  FindQuery,
  GetOptions,
  QueryOptions,
  UpdateOptions,
  WithID,
} from "./types";

// Ideally this type should never be used outside of this file. It's only here
// to fix some backward incompatible change we made on the asset.status field.
type DBAsset =
  | WithID<Asset>
  | (Omit<Asset, "status" | "storage"> & {
      id: string;

      // These are deprecated fields from when we had a separate status.storage field.
      status: Asset["status"] & {
        storage: {
          ipfs: {
            taskIds: Asset["storage"]["status"]["tasks"];
            data?: Task["output"]["export"]["ipfs"];
          };
        };
      };
      storage: {
        ipfs: Asset["storage"]["ipfs"]["spec"];
      };
    });

const isUpdatedSchema = (asset: DBAsset): asset is WithID<Asset> => {
  return (
    !asset?.storage?.ipfs ||
    "status" in asset.storage ||
    "spec" in asset.storage.ipfs ||
    "cid" in asset.storage.ipfs
  );
};

export const taskOutputToIpfsStorage = (
  out: Task["output"]["export"]["ipfs"]
): Omit<Asset["storage"]["ipfs"], "spec"> => ({
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
});

const ipfsStatusCompat = (
  status: Exclude<DBAsset, WithID<Asset>>["status"]["storage"]["ipfs"]
): StorageStatus => ({
  phase: status.taskIds.pending
    ? "waiting"
    : status.taskIds.last
    ? "ready"
    : "failed",
  tasks: status.taskIds,
});

// Receives an asset from database and returns it in the new status schema.
//
// TODO: Update existing objects in DB with the new schema to remove this
// compatibility code.
const assetStatusCompat = (asset: DBAsset): WithID<Asset> =>
  isUpdatedSchema(asset)
    ? asset
    : {
        ...asset,
        storage: {
          ipfs: {
            spec: asset.storage.ipfs,
            ...taskOutputToIpfsStorage(asset.status.storage.ipfs.data),
          },
          status: ipfsStatusCompat(asset.status.storage.ipfs),
        },
        status: _.omit(asset.status, "storage"),
      };

type StorageStatus = Asset["storage"]["status"];

export const mergeStorageStatus = <S extends StorageStatus>(
  s1: S,
  s2: Partial<S>
): S => ({
  ...s1,
  ...s2,
  tasks: {
    ...s1?.tasks,
    ...s2?.tasks,
  },
});

// This is mostly a compatibility helper which transforms assets read from the
// database into the new schema (with status object instead of status string).
//
// Any methods not overridden here will return the raw DBAsset objects and that
// is by design. If you need to use any method that is not here and need to
// access the status as an object, first create the corresponding override which
// transforms the returned objects here.
export default class AssetTable extends Table<DBAsset> {
  async get(id: string, opts?: GetOptions): Promise<WithID<Asset>> {
    const asset = await super.get(id, opts);
    return assetStatusCompat(asset);
  }

  async find(
    query?: FindQuery | SQLStatement[],
    opts?: FindOptions
  ): Promise<[WithID<Asset>[], string]> {
    const [assets, cursor] = await super.find(query, opts);
    return [assets?.map(assetStatusCompat), cursor];
  }

  create(doc: WithID<Asset>): Promise<WithID<Asset>> {
    return super.create(doc) as Promise<WithID<Asset>>;
  }

  update(
    query: string | SQLStatement[],
    doc: Partial<WithID<Asset>>,
    opts?: UpdateOptions
  ): Promise<QueryResult<unknown>> {
    return super.update(query, doc, opts);
  }

  async getByPlaybackId(
    playbackId: string,
    opts?: QueryOptions
  ): Promise<WithID<Asset>> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT id, data FROM asset WHERE data->>'playbackId' = ${playbackId}`.setName(
        `${this.name}_by_playbackid`
      ),
      opts
    );
    if (res.rowCount < 1) {
      return null;
    }
    return assetStatusCompat(res.rows[0].data as WithID<Asset>);
  }

  async getByIpfsCid(cid: string): Promise<WithID<Asset>> {
    const query = [
      sql`asset.data->'storage'->'ipfs'->'status'->'addresses'->>'videoFileCid' = ${cid}`,
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
}
