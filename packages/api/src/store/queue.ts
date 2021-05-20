import sql, { SQLStatement } from "sql-template-strings";
import { DB } from "./db";
import logger from "../logger";
import { BadRequestError } from "./errors";
import { QueryResult, PoolClient } from "pg";
import Table from "./table";
import { Queue } from "../schema/types";

import { TableSchema, GetOptions, DBObject, DBLegacyObject } from "./types";

const DEFAULT_SORT = "id ASC";

export default class QueueTable extends Table<Queue> {
  db: DB;
  schema: TableSchema;
  client: PoolClient;
  constructor({ db, schema }) {
    super({ db, schema });
    this.start();
  }

  async start() {
    this.client = await this.db.pool.connect();
  }

  stop() {
    try {
      this.client.release();
    } catch (error) {
      console.log("error releasing pg client", error);
    }
  }
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
    await this.client.query("BEGIN");
    res = await this.client.query(
      sql`SELECT data FROM `
        .append(this.name)
        .append(
          sql` WHERE data->>'isConsumed' = 'false' AND data->>'status' = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED`.setName(
            `${this.name}_next_event`
          )
        )
    );

    if (res.rowCount < 1) {
      return null;
    }

    let originalData = res.rows[0].data;
    // res.rows[0].data.isConsumed = true;
    res.rows[0].data.status = "processing";
    res.rows[0].data.modifiedAt = Date.now();
    console.log("id: ", res.rows);
    await this.client.query(
      sql`UPDATE queue SET data = data || ${res.rows[0].data} `.append(
        ` WHERE id = '${res.rows[0].data.id}'`
      )
    );
    await this.client.query("COMMIT;");
    logger.debug(`MsgQueue consuming ${res.rows[0].id}`);
    return originalData as Queue;
  }

  async emit(doc: Queue): Promise<Queue> {
    if (!doc.status) {
      doc.status = "pending";
    }

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

  async updateMsg(doc: Queue): Promise<Queue> {
    doc.modifiedAt = Date.now();
    await this.client.query(
      sql`UPDATE queue SET data = data || ${doc} `.append(
        ` WHERE id = '${doc.id}'`
      )
    );
  }
}
