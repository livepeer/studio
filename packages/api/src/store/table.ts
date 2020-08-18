import DB from './db'
import { NotFoundError } from './errors'

interface TableSchema {
  table: string
}

interface DBObject {
  id: string
}

export default class Table<T extends DBObject> {
  db: DB
  schema: TableSchema
  constructor({ db, schema }) {
    this.db = db
    this.schema = schema
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

  async replace(key, data) {
    const res = await this.db.query(
      `UPDATE ${this.schema.table} SET data = $1 WHERE id = $2`,
      [JSON.stringify(data), key],
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
