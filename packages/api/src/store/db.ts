import { Pool, QueryConfig, QueryResult } from "pg";
import { parse as parseUrl, format as stringifyUrl } from "url";
import { hostname } from "os";

import logger from "../logger";
import schema from "../schema/schema.json";
import {
  ObjectStore,
  ApiToken,
  User,
  PasswordResetToken,
  Usage,
  Region,
  WebhookResponse,
  Session,
  SigningKey,
  Room,
  Attestation,
  JwtRefreshToken,
} from "../schema/types";
import BaseTable, { TableOptions } from "./table";
import StreamTable from "./stream-table";
import { kebabToCamel } from "../util";
import { QueryOptions, WithID } from "./types";
import MultistreamTargetTable from "./multistream-table";
import WebhookTable from "./webhook-table";
import AssetTable from "./asset-table";
import TaskTable from "./task-table";
import ExperimentTable from "./experiment-table";
import AttestationTable from "./attestation-table";
import SessionTable, { DBSession } from "./session-table";

// Should be configurable, perhaps?
export const CONNECT_TIMEOUT =
  parseInt(process.env.POSTGRES_CONNECT_TIMEOUT) ?? 5000;

export interface PostgresParams {
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
  multistreamTarget: MultistreamTargetTable;
  asset: AssetTable;
  task: TaskTable;
  signingKey: Table<SigningKey>;
  apiToken: Table<ApiToken>;
  jwtRefreshToken: Table<JwtRefreshToken>;
  user: Table<User>;
  experiment: ExperimentTable;
  attestation: AttestationTable;
  usage: Table<Usage>;
  webhook: WebhookTable;
  webhookResponse: Table<WebhookResponse>;
  passwordResetToken: Table<PasswordResetToken>;
  region: Table<Region>;
  session: SessionTable;
  room: Table<Room>;

  postgresUrl: string;
  replicaUrl: string;
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
        application_name: `${appName}-read-${hostname()}`,
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
    await this.pool.end();
  }

  async makeTables() {
    const schemas = schema.components.schemas;
    this.stream = new StreamTable({ db: this, schema: schemas["stream"] });
    this.objectStore = makeTable<ObjectStore>({
      db: this,
      schema: schemas["object-store"],
    });
    this.multistreamTarget = new MultistreamTargetTable({
      db: this,
      schema: schemas["multistream-target"],
    });
    this.apiToken = makeTable<ApiToken>({
      db: this,
      schema: schemas["api-token"],
    });
    this.jwtRefreshToken = makeTable<JwtRefreshToken>({
      db: this,
      schema: schemas["jwt-refresh-token"],
    });
    this.asset = new AssetTable({
      db: this,
      schema: schemas["asset"],
    });
    this.task = new TaskTable({
      db: this,
      schema: schemas["task"],
    });
    this.signingKey = makeTable<SigningKey>({
      db: this,
      schema: schemas["signing-key"],
    });
    this.user = makeTable<User>({ db: this, schema: schemas["user"] });
    this.experiment = new ExperimentTable({
      db: this,
      schema: schemas["experiment"],
    });
    this.attestation = new AttestationTable({
      db: this,
      schema: schemas["attestation"],
    });
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
    this.session = new SessionTable({ db: this, schema: schemas["session"] });
    this.room = makeTable<Room>({ db: this, schema: schemas["room"] });

    const tables = Object.entries(schema.components.schemas).filter(
      ([name, schema]) => "table" in schema && schema.table
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

  // Internal query function — use query() or replicaQuery() externally
  async runQuery<T, I extends any[] = any[]>(
    pool: Pool,
    query: string | QueryConfig<I>,
    values?: I
  ): Promise<QueryResult<T>> {
    let queryLog: string;
    if (typeof query === "string") {
      queryLog = JSON.stringify({ query: query.trim(), values });
    } else {
      queryLog = JSON.stringify(query);
    }
    let result: QueryResult;
    logger.debug(`runQuery phase=start query=${queryLog}`);
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
    logger.debug(
      `runQuery phase=success elapsed=${Date.now() - start}ms rows=${
        result?.rowCount
      } query=${queryLog}`
    );
    return result;
  }
}

// Auto-create database if it doesn't exist
async function ensureDatabase(postgresUrl: string) {
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
