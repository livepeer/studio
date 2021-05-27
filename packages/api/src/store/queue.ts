import sql, { SQLStatement } from "sql-template-strings";
import { DB } from "./db";
import logger from "../logger";
import { BadRequestError } from "./errors";
import { QueryResult, PoolClient, Pool } from "pg";
import Table from "./table";
import { Queue } from "../schema/types";
import { Notification } from "pg/index";
import { TableSchema, GetOptions, DBObject, DBLegacyObject } from "./types";

const DEFAULT_SORT = "id ASC";

export default class QueueTable extends Table<Queue> {
  db: DB;
  schema: TableSchema;
  client: PoolClient;
  listener: PoolClient;
  channel = "webhook_main";
  constructor({ db, schema }) {
    super({ db, schema });
    this.start();
  }

  async start() {
    this.client = await this.db.pool.connect();
    await this.listen();
  }

  stop() {
    try {
      this.client.release();
      this.listener.release();
    } catch (error) {
      console.log("error releasing pg client", error);
    }
  }

  async listen() {
    this.listener = await this.db.pool.connect();
    this.listener.query(`LISTEN ${this.channel}`);
    this.listener.on("notification", async (msg) => {
      console.log("listener got notification: ", msg.channel);
      await this.handleMsg(msg);
    });
    this.listener.on("error", (error) => {
      console.error("Msg Queue Listener Error ", error);
    });
    this.listener.on("end", () => {
      console.log("Msq queue listener ended");
    });
    this.listener.on("notice", (error) => {
      console.warn("Msg Queue Listener Notice: ", error);
    });
  }

  async handleMsg(msg: Notification) {
    // emit it here
    console.log("got NOTIFICATION: ", msg.channel, msg.payload);
  }
  // name: string;
  // constructor({ db, schema }) {
  //   super({ db, schema });
  //   this.db = db;
  //   this.schema = schema;
  //   this.name = schema.queue;
  // }

  // get next event in queue
  async pop(processFunc: Function): Promise<Queue> {
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
    // this allows us to pass a function that will process the event within the lock
    if (processFunc) {
      try {
        await processFunc(originalData as Queue);
      } catch (error) {
        console.log("Msg queue process function error: ", error);
        await this.client.query("ROLLBACK;");
        throw error; // throwing the error till we can handle it better
      }
      res.rows[0].data.isConsumed = true;
      res.rows[0].data.modifiedAt = Date.now();
      await this.client.query(
        sql`UPDATE queue SET data = data || ${res.rows[0].data} `.append(
          ` WHERE id = '${res.rows[0].data.id}'`
        )
      );
    } else {
      res.rows[0].data.status = "processing";
      res.rows[0].data.modifiedAt = Date.now();
      console.log("id: ", res.rows);
      await this.client.query(
        sql`UPDATE queue SET data = data || ${res.rows[0].data} `.append(
          ` WHERE id = '${res.rows[0].data.id}'`
        )
      );
    }

    await this.client.query("COMMIT;");
    logger.debug(`MsgQueue consuming ${res.rows[0].id}`);
    return originalData as Queue;
  }

  async emit(doc: Queue): Promise<Queue> {
    if (!doc.status) {
      doc.status = "pending";
    }

    try {
      await this.client.query("BEGIN;");
      await this.client.query(
        `INSERT INTO ${this.name} VALUES ($1, $2)`, //p
        [doc.id, JSON.stringify(doc)] //p
      );

      if (this.listener) {
        // emit it via notifications
        console.log("emitting NOTIFY");
        await this.client.query(`NOTIFY ${this.channel}, '${doc.id}';`);
      }
      this.client.query("COMMIT;");
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
