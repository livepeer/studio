/**
 * DEPRECATED. Use `db` for stuff instead of  `req.store`.
 */

import schema from '../schema/schema.json'
import { NotFoundError, ForbiddenError, InternalServerError } from './errors'
import { kebabToCamel } from '../util'

export default class Model {
  constructor(db) {
    this.db = db
    this.ready = db.ready
  }

  getTable(id) {
    let [table, uuid] = id.split('/')
    table = kebabToCamel(table)
    return [table, uuid]
  }

  async get(id, cleanWriteOnly = true) {
    const [table, uuid] = this.getTable(id)
    const responses = await this.db[table].get(uuid)
    if (responses && cleanWriteOnly) {
      return this.cleanWriteOnlyResponses(id, responses)
    }
    return responses
  }

  async replace(data) {
    // NOTE: method does not replace objects saved from fields with an index
    if (typeof data !== 'object' || typeof data.id !== 'string') {
      throw new Error(`invalid values: ${JSON.stringify(data)}`)
    }
    const { id, kind } = data
    if (!id || !kind) {
      throw new Error('missing id, kind')
    }

    const key = `${kind}/${id}`
    const record = await this.db.get(key)

    if (!record) {
      throw new NotFoundError(`key not found: ${JSON.stringify(key)}`)
    }

    return await this.db.replace(key, data)

    // NOTE: uncomment code below when replacing objects saved from indexes becomes relevant
    // const operations = await this.getOperations(key, data)
    // if (!operations) {
    // return await this.db.replace(key, data)
    // }

    // await Promise.all(
    //   operations.map(([key, value]) => {
    //     return this.db.replace(key, value)
    //   }),
    // )
  }

  async list({ prefix, cursor, limit, filter, cleanWriteOnly = true }) {
    if (filter) {
      throw new Error('filter no longer supported, use `db.find` instead')
    }
    const [table] = this.getTable(prefix)
    const [responses, nextCursor] = await this.db[table].find(
      {},
      { limit, cursor },
    )
    if (responses.data.length > 0 && cleanWriteOnly) {
      return this.cleanWriteOnlyResponses(prefix, responses)
    }
    return {
      data: responses,
      cursor: nextCursor,
    }
  }

  async listKeys(prefix, cursor, limit) {
    const [table] = this.getTable(prefix)
    const [response, nextCursor] = await this.db[table].find(
      {},
      { limit, cursor },
    )
    const keys = response.map((x) => x.id)
    return [keys, nextCursor]
  }

  async query({ kind, query, cursor, limit }) {
    const [_, ...others] = Object.keys(query)
    if (others.length > 0) {
      throw new Error('you may only query() by one key')
    }
    const [table] = this.getTable(kind)
    const [docs, cursorOut] = await this.db[table].find(query, {
      cursor,
      limit,
    })
    console.log(`back from find: ${JSON.stringify(docs)}`)
    const keys = docs.map((x) => x.id)

    return { data: keys, cursor: cursorOut }
  }

  async queryObjects({
    kind,
    query,
    cursor,
    limit,
    filter,
    cleanWriteOnly = true,
  }) {
    if (filter) {
      throw new Error('filter no longer supported, use db[table].find')
    }
    const [queryKey, ...others] = Object.keys(query)
    if (others.length > 0) {
      throw new Error('you may only query() by one key')
    }
    const [table] = this.getTable(kind)

    let [docs, cursorOut] = await this.db[table].find(
      { query },
      { cursor, limit },
    )
    if (cleanWriteOnly) {
      docs = docs.map((doc) => this.cleanWriteOnlyResponses(kind, doc))
    }
    return { data: docs, cursor: cursorOut }
  }

  async deleteKey(key) {
    const record = await this.get(key)
    if (!record) {
      throw new NotFoundError(`key not found: ${JSON.stringify(key)}`)
    }
    return await this.db.delete(key)
  }

  async delete(key) {
    const [properties, kind] = this.getSchema(key)
    const doc = await this.get(`${key}`)
    if (!doc) {
      throw new NotFoundError(`key not found: ${JSON.stringify(key)}`)
    }

    const operations = await this.getOperations(key, doc)

    await Promise.all(
      operations.map(([key, value]) => {
        return this.db.delete(key)
      }),
    )
  }

  async create(doc) {
    if (typeof doc !== 'object' || typeof doc.id !== 'string') {
      throw new Error(`invalid values: ${JSON.stringify(doc)}`)
    }
    const { id, kind } = doc
    if (!id || !kind || typeof doc.kind !== 'string') {
      throw new Error(`Missing required values: id, kind`)
    }

    const [table] = this.getTable(kind)
    return await this.db[table].create(doc)
  }

  getSchema(kind) {
    const cleanKind = this.getCleanKind(kind)
    const schemas = schema.components.schemas[cleanKind]
    if (!schemas) {
      return [null, null]
    }
    return [schemas.properties, cleanKind]
  }

  getCleanKind(kind) {
    let cleanKind = kind.charAt(0) === '/' ? kind.substring(1) : kind
    return cleanKind.indexOf('/') > -1
      ? cleanKind.substr(0, cleanKind.indexOf('/'))
      : cleanKind
  }

  cleanWriteOnlyResponses(id, responses) {
    // obfuscate writeOnly fields in objects returned
    const [properties] = this.getSchema(id)
    const writeOnlyFields = {}
    if (properties) {
      for (const [fieldName, fieldArray] of Object.entries(properties)) {
        if (fieldArray.writeOnly) {
          writeOnlyFields[fieldName] = null
        }
      }
    }

    if ('data' in responses) {
      responses.data = responses.data.map((x) => ({
        ...x,
        ...writeOnlyFields,
      }))
    } else {
      responses = {
        ...responses,
        ...writeOnlyFields,
      }
    }

    return responses
  }

  close() {
    this.db.close()
  }
}
