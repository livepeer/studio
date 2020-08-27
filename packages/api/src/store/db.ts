import { Pool } from 'pg'
import logger from '../logger'
import { timeout } from '../util'
import { parse as parseUrl, format as stringifyUrl } from 'url'
import { IStore } from '../types/common'
import schema from '../schema/schema.json'
import {
  Stream,
  ObjectStore,
  ApiToken,
  User,
  Webhook,
  PasswordResetToken,
} from '../schema/types'
import Table from './table'
import StreamTable from './stream-table'
import { kebabToCamel } from '../util'

// Should be configurable, perhaps?
const CONNECT_TIMEOUT = 5000

export class DB {
  // Table objects
  stream: StreamTable
  objectStore: Table<ObjectStore>
  apiToken: Table<ApiToken>
  user: Table<User>
  webhook: Table<Webhook>
  passwordResetToken: Table<PasswordResetToken>

  postgresUrl: String
  ready: Promise<void>
  pool: Pool

  constructor() {
    // This is empty now so we can have a `db` singleton. All the former
    // constructor logic has moved to start({}).
  }

  async start({ postgresUrl }) {
    this.postgresUrl = postgresUrl
    if (!postgresUrl) {
      throw new Error('no postgres url provided')
    }
    try {
      await ensureDatabase(postgresUrl)
    } catch (e) {
      console.error(`error in ensureDatabase: ${e.message}`)
      throw e
    }
    this.pool = new Pool({
      connectionTimeoutMillis: CONNECT_TIMEOUT,
      connectionString: postgresUrl,
    })
    await this.query('SELECT NOW()')
    await this.makeTables()
  }

  async close() {
    if (!this.pool) {
      return
    }
    await this.pool.end()
  }

  async makeTables() {
    const schemas = schema.components.schemas
    this.stream = new StreamTable({ db: this, schema: schemas['stream'] })
    this.objectStore = new Table<ObjectStore>({
      db: this,
      schema: schemas['object-store'],
    })
    this.apiToken = new Table<ApiToken>({
      db: this,
      schema: schemas['api-token'],
    })
    this.user = new Table<User>({ db: this, schema: schemas['user'] })
    this.webhook = new Table<Webhook>({ db: this, schema: schemas['webhook'] })
    this.passwordResetToken = new Table<PasswordResetToken>({
      db: this,
      schema: schemas['password-reset-token'],
    })

    const tables = Object.entries(schema.components.schemas).filter(
      ([name, schema]) => !!schema.table,
    )
    await Promise.all(
      tables.map(([name, schema]) => {
        const camelName = kebabToCamel(name)
        return this[camelName].ensureTable()
      }),
    )
  }

  async query(query, ...params) {
    console.log(query)
    return this.pool.query(query, ...params)
  }
}

// Auto-create database if it doesn't exist
async function ensureDatabase(postgresUrl) {
  const pool = new Pool({
    connectionString: postgresUrl,
    connectionTimeoutMillis: CONNECT_TIMEOUT,
  })
  try {
    await pool.query('SELECT NOW()')
    // If we made it down here, the database exists. Cool.
    pool.end()
    return
  } catch (e) {
    // We only know how to handle one error...
    if (!e.message.includes('does not exist')) {
      throw e
    }
  }
  const parsed = parseUrl(postgresUrl)
  const dbName = parsed.pathname.slice(1)
  parsed.pathname = '/postgres'
  const adminUrl = stringifyUrl(parsed)
  const adminPool = new Pool({
    connectionTimeoutMillis: CONNECT_TIMEOUT,
    connectionString: adminUrl,
  })
  await adminPool.query('SELECT NOW()')
  await adminPool.query(`CREATE DATABASE ${dbName}`)
  logger.info(`Created database ${dbName}`)
  pool.end()
  adminPool.end()
}

export default new DB()
