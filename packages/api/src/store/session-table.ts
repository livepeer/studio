import sql from "sql-template-strings";
import Table from "./table";
import { QueryResult } from "pg";
import { DBLegacyObject, QueryOptions, WithID } from "./types";
import { Session } from "../schema/types";
import { DeprecatedStreamFields, StreamStats } from "./stream-table";

export type DBSession = WithID<Session> & StreamStats & DeprecatedStreamFields;

export default class SessionTable extends Table<DBSession> {
  async getLastSession(parentId: string, opts?: QueryOptions) {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT * FROM session  WHERE data->>'parentId'=${parentId} ORDER BY data->>'createdAt' DESC LIMIT 1`.setName(
        `${this.name}_last_by_parentid`
      ),
      opts
    );
    return res.rowCount < 1 ? null : (res.rows[0].data as DBSession);
  }
}
