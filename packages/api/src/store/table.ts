import sql from 'sql-template-strings'
import DB from './db'
import { NotFoundError } from './errors'

interface TableSchema {
  table: string
}

interface DBObject {
  id: string
}

interface ListQuery {
  [key: string]: any
}

interface ListOptions {
  cursor?: string
}

export default class Table<T extends DBObject> {
  db: DB
  schema: TableSchema
  constructor({ db, schema }) {
    this.db = db
    this.schema = schema
  }

  async get(id): Promise<T> {
    const res = await this.db.query(
      sql`SELECT data FROM ${this.schema.table} WHERE id=${id}`,
    )

    if (res.rowCount < 1) {
      return null
    }
    return res.rows[0].data
  }

  async list(query: ListQuery, opts: ListOptions) {
    const { cursor } = opts
    let res = null

    if (cursor) {
      res = await this.query(
        `SELECT * FROM ${this.schema.table} WHERE id LIKE $1 AND id > $2 ORDER BY id ASC LIMIT $3 `,
        [`${prefix}%`, `${cursor}`, `${limit}`],
      )
    } else {
      res = await this.query(
        `SELECT * FROM ${this.schema.table} WHERE id LIKE $1 ORDER BY id ASC LIMIT $2 `,
        [`${prefix}%`, `${limit}`],
      )
    }

    const data = res.rows.map(({ id, data }) => ({ [id]: data }))

    if (data.length < 1) {
      return { data, cursor: null }
    }

    return { data, cursor: res.rows[data.length - 1].id }
  }

  async create(doc: T): Promise<T> {
    try {
      await this.db.query(
        `INSERT INTO ${this.schema.table} VALUES ($1, $2)`, //p
        [doc.id, JSON.stringify(doc)], //p
      )
    } catch (e) {
      if (e.message.includes('duplicate key value')) {
        throw new Error(`${doc.id} already exists`)
      }
      throw e
    }
    return doc
  }

  async replace(doc: T) {
    const res = await this.db.query(
      `UPDATE ${this.schema.table} SET data = $1 WHERE id = $2`,
      [JSON.stringify(doc), doc.id],
    )

    if (res.rowCount < 1) {
      throw new NotFoundError()
    }
  }

  async delete(id) {
    const res = await this.db.query(
      `DELETE FROM ${this.schema.table} WHERE id = $1`,
      [id],
    )

    if (res.rowCount < 1) {
      throw new NotFoundError()
    }
  }
}
