import sql, { SQLStatement } from "sql-template-strings";
import { DB } from "./db";
import logger from "../logger";
import { BadRequestError } from "./errors";
import { QueryResult } from "pg";
import Table from "./table";
import { Queue } from "../schema/types";

import { TableSchema, GetOptions, DBObject, DBLegacyObject } from "./types";

const DEFAULT_SORT = "id ASC";

export default class QueueTable extends Table<Queue> {
  db: DB;
  schema: TableSchema;
  // name: string;
  // constructor({ db, schema }) {
  //   super({ db, schema });
  //   this.db = db;
  //   this.schema = schema;
  //   this.name = schema.queue;
  // }

  // get next event in queue
  async pop(opts: GetOptions = { useReplica: true }): Promise<Queue> {
    let res: QueryResult<DBLegacyObject>;
    if (!opts.useReplica) {
      res = await this.db.query(
        sql`SELECT data FROM `
          .append(this.name)
          .append(
            sql` LIMIT 1 FOR UPDATE SKIP LOCKED`.setName(
              `${this.name}_next_event`
            )
          )
      );
    } else {
      res = await this.db.replicaQuery(
        sql`SELECT data FROM `
          .append(this.name)
          .append(
            sql` LIMIT 1 FOR UPDATE SKIP LOCKED`.setName(
              `${this.name}_next_event`
            )
          )
      );
    }

    if (res.rowCount < 1) {
      return null;
    }

    logger.debug(`MsgQueue consuming ${res.rows[0].id}`);
    return res.rows[0].data as Queue;
  }

  async emit(doc: Queue): Promise<Queue> {
    try {
      await this.db.query(
        `INSERT INTO ${this.name} VALUES ($1, $2)`, //p
        [doc.id, JSON.stringify(doc)] //p
      );
    } catch (e) {
      if (e.message.includes("duplicate key value")) {
        throw new BadRequestError(e.detail);
      }
      throw e;
    }
    logger.debug(`MsgQueue emitting ${doc.id}`);
    return doc;
  }
}
