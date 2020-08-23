import sql from 'sql-template-strings'
import DB from './db'
import logger from '../logger'
import { BadRequestError, NotFoundError } from './errors'

interface TableSchema {
  table: string
}

interface DBObject {
  id: string
}

interface FindQuery {
  [key: string]: any
}

interface FindOptions {
  cursor?: string
  limit?: number
}

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
  async get(id: string): Promise<T> {
    console.log(id)
    if (!id) {
      throw new Error('missing id')
    }
    const res = await this.db.query(
      sql`SELECT data FROM `.append(this.name).append(sql` WHERE id=${id}`),
    )

    if (res.rowCount < 1) {
      return null
    }
    return res.rows[0].data
  }

  // returns [docs, cursor]
  async find(
    query: FindQuery = {},
    opts: FindOptions,
  ): Promise<[Array<T>, string]> {
    const { cursor, limit = 100 } = opts

    const q = sql`SELECT * FROM `.append(this.name)
    const filters = []
    if (cursor) {
      filters.push(sql`id > ${cursor}`)
    }
    for (const [key, value] of Object.entries(query)) {
      filters.push(sql``.append(`data->>'${key}' = `).append(sql`${value}`))
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
    }

    q.append(sql`LIMIT ${limit}`)

    const res = await this.db.query(q)

    const docs = res.rows.map(({ data }) => data)

    if (docs.length < 1) {
      return [docs, null]
    }

    console.log(docs)
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
    console.log(`returning ${JSON.stringify(doc)}`)
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

  async delete(id) {
    const res = await this.db.query(`DELETE FROM ${this.name} WHERE id = $1`, [
      id,
    ])

    if (res.rowCount < 1) {
      throw new NotFoundError()
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
