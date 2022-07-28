import { QueryResult } from "pg";
import sql, { SQLStatement } from "sql-template-strings";
import { Asset } from "../schema/types";
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
  | Omit<Asset, "status"> & {
      id: string;

      // These are deprecated fields from when we didn't have the top-level
      // status object in the asset resources.
      updatedAt?: Asset["status"]["updatedAt"];
      status?: Asset["status"] | Asset["status"]["phase"];
    };

// Receives an asset from database and returns it in the new status schema.
//
// TODO: Update existing objects in DB with the new schema to remove this
// compatibility code.
const assetStatusCompat = (asset: DBAsset): WithID<Asset> =>
  !asset || typeof asset.status === "object"
    ? (asset as WithID<Asset>)
    : {
        ...{ ...asset, updatedAt: undefined },
        status: {
          phase: asset.status,
          updatedAt: asset.updatedAt,
        },
      };

export const mergeAssetStatus = (
  s1: Asset["status"],
  s2: Partial<Asset["status"]>,
  updatedAt: number = Date.now()
): Asset["status"] => ({
  ...s1,
  ...s2,
  updatedAt,
  storage: {
    ...s1?.storage,
    ...s2?.storage,
    ipfs: {
      ...s1?.storage?.ipfs,
      ...s2?.storage?.ipfs,
      taskIds: {
        ...s1?.storage?.ipfs?.taskIds,
        ...s2?.storage?.ipfs?.taskIds,
      },
      // data is not mergeable, just keep the result of the spread above (s2>s1)
    },
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
      sql`asset.data->'status'->'storage'->'ipfs'->'data'->>'videoFileCid' = ${cid}`,
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
