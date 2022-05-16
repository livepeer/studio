import { QueryResult } from "pg";
import { SQLStatement } from "sql-template-strings";
import { Asset } from "../schema/types";
import Table from "./table";
import {
  FindOptions,
  FindQuery,
  GetOptions,
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
}
