import sql, { SQLStatement } from 'sql-template-strings'
import { DB } from './db'
import logger from '../logger'
import { BadRequestError, NotFoundError } from './errors'
import { QueryArrayResult, QueryResult } from 'pg'

import {
  TableSchema,
  GetOptions,
  DBObject,
  FindQuery,
  FindOptions,
  DBLegacyObject,
} from './types'

export default class Table<T extends DBObject> {
  db: DB
  schema: TableSchema
  name: string
  constructor({ db, schema }) {
    this.db = db
    this.schema = schema
    this.name = schema.table
  }

  // get a single document by id
  async get(id: string, opts: GetOptions = { useReplica: true }): Promise<T> {
    if (!id) {
      throw new Error('missing id')
    }
    let res: QueryResult<DBLegacyObject>
    if (!opts.useReplica) {
      res = await this.db.query(
        sql`SELECT data FROM `
          .append(this.name)
          .append(sql` WHERE id=${id}`.setName(`${this.name}_by_id`)),
      )
    } else {
      res = await this.db.replicaQuery(
        sql`SELECT data FROM `
          .append(this.name)
          .append(sql` WHERE id=${id}`.setName(`${this.name}_by_id`)),
      )
    }

    if (res.rowCount < 1) {
      return null
    }
    return res.rows[0].data as T
  }

  // returns [docs, cursor]
  async find(
    query: FindQuery | Array<SQLStatement> = {},
    opts: FindOptions = {},
  ): Promise<[Array<T>, string]> {
    const { cursor = '', limit = 100, useReplica = true } = opts

    const q = sql`SELECT * FROM `.append(this.name)
    let filters = []

    // We can either pass in an array of sql`` statements...
    if (Array.isArray(query)) {
      filters = [...query]
    }

    // ...or a {name: "whatever"} query
    else {
      for (const [key, value] of Object.entries(query)) {
        filters.push(sql``.append(`data->>'${key}' = `).append(sql`${value}`))
      }
    }
    if (cursor) {
      filters.push(sql`data->>'id' > ${cursor}`)
    }
    let first = true
    for (const filter of filters) {
      if (first) {
        q.append(' WHERE ')
      } else {
        q.append(' AND ')
      }
      first = false
      q.append(filter)
      q.append(' ')
    }

    q.append(' ORDER BY id ASC')
    q.append(sql` LIMIT ${limit}`)

    let res
    if (useReplica) {
      res = await this.db.replicaQuery(q)
    } else {
      res = await this.db.query(q)
    }

    const docs = res.rows.map(({ data }) => data)

    if (docs.length < 1) {
      return [docs, null]
    }

    return [docs, docs[docs.length - 1].id]
  }

  async create(doc: T): Promise<T> {
    try {
      await this.db.query(
        `INSERT INTO ${this.name} VALUES ($1, $2)`, //p
        [doc.id, JSON.stringify(doc)], //p
      )
    } catch (e) {
      if (e.message.includes('duplicate key value')) {
        throw new BadRequestError(e.detail)
      }
      throw e
    }
    return doc
  }

  async replace(doc: T) {
    const res = await this.db.query(
      `UPDATE ${this.name} SET data = $1 WHERE id = $2`,
      [JSON.stringify(doc), doc.id],
    )

    if (res.rowCount < 1) {
      throw new NotFoundError(`${this.name} id=${doc.id} not found`)
    }
  }

  async update(id: string, doc: T) {
    const q = sql`UPDATE `.append(this.name).append(sql`
      SET data = data || ${JSON.stringify(doc)}
      WHERE id = ${id}
    `)

    const res = await this.db.query(q)

    if (res.rowCount < 1) {
      throw new NotFoundError(`${this.name} id=${doc.id} not found`)
    }
  }

  async delete(id) {
    const res = await this.db.query(`DELETE FROM ${this.name} WHERE id = $1`, [
      id,
    ])

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} id=${id}`)
    }
  }

  // on startup: auto-create table if it doesn't exist
  async ensureTable() {
    let res
    try {
      res = await this.db.query(`
        SELECT * FROM ${this.name} LIMIT 0;
      `)
    } catch (e) {
      if (!e.message.includes('does not exist')) {
        throw e
      }
      await this.db.query(`
          CREATE TABLE ${this.name} (
            id VARCHAR(128) PRIMARY KEY,
            data JSONB
          );
        `)
      logger.info(`Created table ${this.name}`)
    }
    await Promise.all(
      Object.entries(this.schema.properties).map(([propName, prop]) =>
        this.ensureIndex(propName, prop),
      ),
    )
  }

  // on startup: auto-create indices if they don't exist
  async ensureIndex(propName, prop) {
    if (!prop.index && !prop.unique) {
      return
    }
    let unique = ''
    if (prop.unique) {
      unique = 'unique'
    }
    const indexName = `${this.name}_${propName}`
    try {
      await this.db.query(`
          CREATE ${unique} INDEX "${indexName}" ON "${this.name}" USING BTREE ((data->>'${propName}'));
        `)
    } catch (e) {
      if (!e.message.includes('already exists')) {
        throw e
      }
      return
    }
    logger.info(`Created ${unique} index ${indexName} on ${this.name}`)
  }
}
