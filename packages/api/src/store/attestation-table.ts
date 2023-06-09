import sql, { SQLStatement } from "sql-template-strings";
import { Asset, Attestation, Task, User } from "../schema/types";
import Table from "./table";
import { QueryOptions, WithID } from "./types";

export default class AttestationTable extends Table<WithID<Attestation>> {
  async getByIdOrCid(idOrCid: string, opts?: QueryOptions) {
    const query = [
      sql`attestation.id = ${idOrCid}`,
      // TODO: VID-214, get by the metadata CID
    ];
    const [attestations] = await this.find(query, {
      ...opts,
      limit: 1,
    });
    if (attestations.length < 1) {
      return null;
    }
    return attestations[0];
  }
}
