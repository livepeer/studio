import { Pool } from 'pg'
import logger from '../logger'
import { NotFoundError } from './errors'
import { timeout } from '../util'
import { parse as parseUrl, format as stringifyUrl } from 'url'
import { IStore } from '../types/common'
import schema from '../schema/schema.json'

// Should be configurable, perhaps?
const TABLE_NAME = 'api'
const CONNECT_TIMEOUT = 5000
const DEFAULT_LIMIT = 100

export default class PostgresStore implements IStore {
  postgresUrl: String
  ready: Promise<void>
  pool: Pool
  constructor({ postgresUrl }) {
    this.postgresUrl = postgresUrl
    console.log(postgresUrl)
    if (!postgresUrl) {
      throw new Error('no postgres url provided')
    }
    this.ready = (async () => {
      await ensureDatabase(postgresUrl)
      this.pool = new Pool({
        connectionTimeoutMillis: CONNECT_TIMEOUT,
        connectionString: postgresUrl,
      })
      await this.query('SELECT NOW()')
      await this.ensureTables()
    })()
  }

  async close() {
    if (!this.pool) {
      return
    }
    // await this.pool.end()
  }

  async listKeys(prefix = '', cursor, limit = DEFAULT_LIMIT) {
    const listRes = await this.list(prefix, cursor, limit)
    const keys = listRes.data.map((item) => Object.keys(item)[0])
    return [keys, listRes.cursor]
  }

  async list(prefix = '', cursor = null, limit = DEFAULT_LIMIT) {
    let res = null

    if (cursor) {
      res = await this.query(
        `SELECT * FROM ${TABLE_NAME} WHERE id LIKE $1 AND id > $2 ORDER BY id ASC LIMIT $3 `,
        [`${prefix}%`, `${cursor}`, `${limit}`],
      )
    } else {
      res = await this.query(
        `SELECT * FROM ${TABLE_NAME} WHERE id LIKE $1 ORDER BY id ASC LIMIT $2 `,
        [`${prefix}%`, `${limit}`],
      )
    }

    const data = res.rows.map(({ id, data }) => ({ [id]: data }))

    if (data.length < 1) {
      return { data, cursor: null }
    }

    return { data, cursor: res.rows[data.length - 1].id }
  }

  async get(id) {
    const res = await this.query(`SELECT data FROM ${TABLE_NAME} WHERE id=$1`, [
      id,
    ])

    if (res.rowCount < 1) {
      return null
    }
    return res.rows[0].data
  }

  async create(key, data) {
    try {
      await this.query(
        `INSERT INTO ${TABLE_NAME} VALUES ($1, $2)`, //p
        [key, JSON.stringify(data)], //p
      )
    } catch (e) {
      if (e.message.includes('duplicate key value')) {
        throw new Error(`${data.id} already exists`)
      }
      throw e
    }
    return data
  }

  async replace(key, data) {
    const res = await this.query(
      `UPDATE ${TABLE_NAME} SET data = $1 WHERE id = $2`,
      [JSON.stringify(data), key],
    )

    if (res.rowCount < 1) {
      throw new NotFoundError()
    }
  }

  async delete(id) {
    const res = await this.query(`DELETE FROM ${TABLE_NAME} WHERE id = $1`, [
      id,
    ])

    if (res.rowCount < 1) {
      throw new NotFoundError()
    }
  }

  async ensureTables() {
    const tables = Object.values(schema.components.schemas).filter(
      (schema) => !!schema.table,
    )
    for (const table of tables) {
      await this.ensureTable(table.table)
    }
    // await Promise.all(
    //   tables.map(([_, schema]) => this.ensureTable(schema.table)),
    // )
    console.log('after all')
  }

  // Auto-create table if it doesn't exist
  async ensureTable(tableName) {
    let res
    try {
      res = await this.query(`
      SELECT * FROM ${tableName} LIMIT 0;
    `)
    } catch (e) {
      if (!e.message.includes('does not exist')) {
        throw e
      }
      await this.query(`
        CREATE TABLE ${tableName} (
          id VARCHAR(128) PRIMARY KEY,
          data JSONB
        );
      `)
      logger.info(`Created table ${tableName}`)
    }
  }

  async query(query) {
    console.log(query)
    return this.pool.query(query)
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
  // const adminPool = n
}
