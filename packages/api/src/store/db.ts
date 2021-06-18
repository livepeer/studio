import { Pool } from "pg";
import logger from "../logger";
import { parse as parseUrl, format as stringifyUrl } from "url";
import schema from "../schema/schema.json";
import { QueryResult, QueryConfig } from "pg";
import { hostname } from "os";
import {
  ObjectStore,
  ApiToken,
  User,
  Webhook,
  PasswordResetToken,
  PushTarget,
  Usage,
  Region,
  WebhookResponse,
  Session,
} from "../schema/types";
import BaseTable, { TableOptions } from "./table";
import StreamTable from "./stream-table";
import QueueTable from "./queue";
import { kebabToCamel } from "../util";
import { QueryOptions, WithID } from "./types";
import PushTargetTable from "./push-target-table";
import WebhookTable from "./webhook-table";

// Should be configurable, perhaps?
const CONNECT_TIMEOUT = 5000;

interface PostgresParams {
  postgresUrl: string;
  postgresReplicaUrl?: string;
  appName?: string;
}

type Table<T> = BaseTable<WithID<T>>;

const makeTable = <T>(opts: TableOptions) =>
  new BaseTable<WithID<T>>(opts) as Table<T>;

export class DB {
  // Table objects
  stream: StreamTable;
  objectStore: Table<ObjectStore>;
  pushTarget: PushTargetTable;
  apiToken: Table<ApiToken>;
  user: Table<User>;
  usage: Table<Usage>;
  webhook: WebhookTable;
  webhookResponse: Table<WebhookResponse>;
  passwordResetToken: Table<PasswordResetToken>;
  region: Table<Region>;
  queue: QueueTable;
  session: Table<Session>;

  postgresUrl: String;
  replicaUrl: String;
  ready: Promise<void>;
  pool: Pool;
  replicaPool: Pool;

  constructor() {
    // This is empty now so we can have a `db` singleton. All the former
    // constructor logic has moved to start({}).
  }

  async start({
    postgresUrl,
    postgresReplicaUrl,
    appName = "api",
  }: PostgresParams) {
    this.postgresUrl = postgresUrl;
    if (!postgresUrl) {
      throw new Error("no postgres url provided");
    }
    try {
      await ensureDatabase(postgresUrl);
    } catch (e) {
      console.error(`error in ensureDatabase: ${e.message}`);
      throw e;
    }
    this.pool = new Pool({
      connectionTimeoutMillis: CONNECT_TIMEOUT,
      connectionString: postgresUrl,
      application_name: `${appName}-${hostname()}`,
    });

    if (postgresReplicaUrl) {
      console.log("replica url found, using read replica");
      this.replicaPool = new Pool({
        connectionTimeoutMillis: CONNECT_TIMEOUT,
        connectionString: postgresReplicaUrl,
      });
    } else {
      console.log("no replica url found, not using read replica");
    }

    await this.query("SELECT NOW()");
    await this.replicaQuery("SELECT NOW()");
    await this.makeTables();
  }

  async close() {
    if (!this.pool) {
      return;
    }
    try {
      if (this.queue) {
        await this.queue.stop();
      }
    } catch (error) {
      console.log("stopping queue error", error);
    }
    await this.pool.end();
  }

  async makeTables() {
    const schemas = schema.components.schemas;
    this.stream = new StreamTable({ db: this, schema: schemas["stream"] });
    this.objectStore = makeTable<ObjectStore>({
      db: this,
      schema: schemas["object-store"],
    });
    this.pushTarget = new PushTargetTable({
      db: this,
      schema: schemas["push-target"],
    });
    this.apiToken = makeTable<ApiToken>({
      db: this,
      schema: schemas["api-token"],
    });
    this.user = makeTable<User>({ db: this, schema: schemas["user"] });
    this.usage = makeTable<Usage>({ db: this, schema: schemas["usage"] });
    this.webhook = new WebhookTable({ db: this, schema: schemas["webhook"] });
    this.passwordResetToken = makeTable<PasswordResetToken>({
      db: this,
      schema: schemas["password-reset-token"],
    });

    this.region = makeTable<Region>({ db: this, schema: schemas["region"] });
    this.webhookResponse = makeTable<WebhookResponse>({
      db: this,
      schema: schemas["webhook-response"],
    });
    this.queue = new QueueTable({ db: this, schema: schemas["queue"] });
    await this.queue.start();
    this.session = makeTable<Session>({ db: this, schema: schemas["session"] });

    const tables = Object.entries(schema.components.schemas).filter(
      ([name, schema]) => "table" in schema
    );
    await Promise.all(
      tables.map(([name, schema]) => {
        const camelName = kebabToCamel(name);
        return this[camelName].ensureTable();
      })
    );
  }

  queryWithOpts<T, I extends any[] = any[]>(
    query: QueryConfig<I>,
    opts: QueryOptions = { useReplica: true }
  ): Promise<QueryResult<T>> {
    const { useReplica = true } = opts;
    if (useReplica && this.replicaPool) {
      return this.replicaPool.query(query);
    }
    return this.pool.query(query);
  }

  query<T, I extends any[] = any[]>(
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    return this.runQuery(this.pool, query, values);
  }

  replicaQuery<T, I extends any[] = any[]>(
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    let pool = this.replicaPool ?? this.pool;
    return this.runQuery(pool, query, values);
  }

  // Internal logging function — use query() or replicaQuery() externally
  async runQuery<T, I extends any[] = any[]>(
    pool: Pool,
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    let queryLog;
    if (typeof query === "string") {
      queryLog = JSON.stringify({ query: query.trim(), values });
    } else {
      queryLog = JSON.stringify(query);
    }
    let result;
    logger.info(`runQuery phase=start query=${queryLog}`);
    const start = Date.now();
    try {
      result = await pool.query(query, values);
    } catch (e) {
      logger.error(
        `runQuery phase=error elapsed=${Date.now() - start}ms error=${
          e.message
        } query=${queryLog}`
      );
      throw e;
    }
    logger.info(
      `runQuery phase=success elapsed=${Date.now() - start}ms rows=${
        result?.rowCount
      } query=${queryLog}`
    );
    return result;
  }
}

// Auto-create database if it doesn't exist
async function ensureDatabase(postgresUrl) {
  const pool = new Pool({
    connectionString: postgresUrl,
    connectionTimeoutMillis: CONNECT_TIMEOUT,
  });
  try {
    await pool.query("SELECT NOW()");
    // If we made it down here, the database exists. Cool.
    pool.end();
    return;
  } catch (e) {
    // We only know how to handle one error...
    if (!e.message.includes("does not exist")) {
      throw e;
    }
  }
  const parsed = parseUrl(postgresUrl);
  const dbName = parsed.pathname.slice(1);
  parsed.pathname = "/postgres";
  const adminUrl = stringifyUrl(parsed);
  const adminPool = new Pool({
    connectionTimeoutMillis: CONNECT_TIMEOUT,
    connectionString: adminUrl,
  });
  await adminPool.query("SELECT NOW()");
  await adminPool.query(`CREATE DATABASE ${dbName}`);
  logger.info(`Created database ${dbName}`);
  pool.end();
  adminPool.end();
}

export default new DB();
