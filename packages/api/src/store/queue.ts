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
  onNotification: any;
  channel = "webhook_main";
  constructor({ db, schema }) {
    super({ db, schema });
    // this.start();
  }

  async start() {
    // this.client = await this.db.pool.connect();
    await this.listen();
  }

  stop() {
    try {
      if (this.client) {
        this.client.release();
      }
      this.listener.release();
    } catch (error) {
      console.log("error releasing pg client", error);
    }
  }

  unsetMsgHandler() {
    this.setMsgHandler(QueueTable.prototype.handleMsg);
  }

  async listen() {
    this.listener = await this.db.pool.connect();
    await this.listener.query(`LISTEN ${this.channel}`);
    this.onNotification = this.listener.on("notification", this.handleMsg);

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

  async setMsgHandler(
    func: (msg: Notification) => Promise<void>
  ): Promise<any> {
    console.log("setting msg handler");
    // this.handleMsg = func;
    this.listener.removeListener("notification", this.handleMsg);
    this.listener.on("notification", func);
    return true;
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
  async pop(processFunc: (q: Queue) => any): Promise<Queue> {
    let res: QueryResult<DBLegacyObject>;
    this.client = await this.db.pool.connect();
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
        // change event status to error
        res.rows[0].data.isConsumed = false;
        res.rows[0].data.modifiedAt = Date.now();
        res.rows[0].data.status = "error";
        await this.client.query(
          sql`UPDATE queue SET data = data || ${res.rows[0].data} `.append(
            ` WHERE id = '${res.rows[0].data.id}'`
          )
        );
        return;
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
    try {
      this.client.release();
    } catch (e) {
      console.log("pg release error: ", e);
    }
    logger.debug(`MsgQueue consuming ${res.rows[0].id}`);
    return originalData as Queue;
  }

  async emit(doc: Queue): Promise<Queue> {
    if (!doc.status) {
      doc.status = "pending";
    }

    doc.createdAt = Date.now();
    this.client = await this.db.pool.connect();
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
      this.client.release();
    } catch (e) {
      if (e.message.includes("duplicate key value")) {
        console.log(`DUPLICATE KEY ERROR : ${e.detail}`);
      }
    }
    logger.debug(`MsgQueue emitting ${doc.id}`);
    return doc;
  }

  async updateMsg(doc: Queue): Promise<Queue> {
    doc.modifiedAt = Date.now();
    await this.client.query(
      sql`UPDATE queue SET data = data || ${doc} `.append(
        sql` WHERE id = '${doc.id}'`
      )
    );
  }
}
