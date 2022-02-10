import sql, { SQLStatement } from "sql-template-strings";
import { DB } from "./db";
import logger from "../logger";
import { BadRequestError, NotFoundError } from "./errors";
import { QueryArrayResult, QueryResult } from "pg";

import {
  TableSchema,
  GetOptions,
  DBObject,
  FindQuery,
  FindOptions,
  UpdateOptions,
  DBLegacyObject,
  FieldSpec,
} from "./types";

const DEFAULT_SORT = "id ASC";

export interface TableOptions {
  db: DB;
  schema: TableSchema;
}

export default class Table<T extends DBObject> {
  db: DB;
  schema: TableSchema;
  name: string;

  constructor({ db, schema }: TableOptions) {
    this.db = db;
    this.schema = schema;
    this.name = schema.table;
  }

  // get a single document by id
  async get(id: string, opts: GetOptions = { useReplica: true }): Promise<T> {
    if (!id) {
      throw new Error("missing id");
    }
    let res: QueryResult<DBLegacyObject>;
    if (!opts.useReplica) {
      res = await this.db.query(
        sql`SELECT data FROM `
          .append(this.name)
          .append(sql` WHERE id=${id}`.setName(`${this.name}_by_id`))
      );
    } else {
      res = await this.db.replicaQuery(
        sql`SELECT data FROM `
          .append(this.name)
          .append(sql` WHERE id=${id}`.setName(`${this.name}_by_id`))
      );
    }

    if (res.rowCount < 1) {
      return null;
    }
    return res.rows[0].data as T;
  }

  async getMany(
    ids: Array<string>,
    opts: GetOptions = { useReplica: true }
  ): Promise<Array<T>> {
    if (!ids || !ids.length) {
      throw new Error("missing ids");
    }
    let res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      {
        name: `${this.name}_by_ids_${ids.length}`,
        text: `SELECT data FROM ${this.name}  WHERE id IN (${ids
          .map((_, i) => "$" + (i + 1))
          .join(",")})`,
        values: ids,
      },
      opts
    );

    if (res.rowCount < 1) {
      return null;
    }
    return res.rows.map((o) => o.data as T);
  }

  // returns [docs, cursor]
  async find(
    query: FindQuery | Array<SQLStatement> = {},
    opts: FindOptions = {}
  ): Promise<[Array<T>, string]> {
    const {
      cursor = "",
      useReplica = true,
      order = DEFAULT_SORT,
      fields = "*",
      from = this.name,
      process,
    } = opts;
    let limit = opts.hasOwnProperty("limit") ? opts.limit : 100;
    if (typeof limit === "string") {
      limit = parseInt(limit);
    }

    const q = sql`SELECT `.append(fields).append(` FROM `).append(from);
    let filters = [];

    // We can either pass in an array of sql`` statements...
    if (Array.isArray(query)) {
      filters = [...query];
    }

    // ...or a {name: "whatever"} query
    else {
      for (const [key, value] of Object.entries(query)) {
        filters.push(sql``.append(`data->>'${key}' = `).append(sql`${value}`));
      }
    }
    if (cursor && !cursor.includes("skip")) {
      filters.push(
        sql``.append(this.name + ".").append(sql`data->>'id' > ${cursor}`)
      );
    }
    let first = true;
    for (const filter of filters) {
      if (first) {
        q.append(" WHERE ");
      } else {
        q.append(" AND ");
      }
      first = false;
      q.append(filter);
      q.append(" ");
    }

    q.append(` ORDER BY ${order}`);
    if (limit) {
      q.append(sql` LIMIT ${limit}`);
    }
    if (cursor && cursor.includes("skip")) {
      q.append(sql` OFFSET ${cursor.replace("skip", "")}`);
    }

    let res;
    if (useReplica) {
      res = await this.db.replicaQuery(q);
    } else {
      res = await this.db.query(q);
    }

    const docs = res.rows.map(process ? process : ({ data }) => data);

    if (docs.length < 1) {
      return [docs, null];
    }
    let newCursor;
    if (limit && docs.length == limit) {
      let curSkip = 0;
      if (cursor && cursor.includes("skip")) {
        curSkip = Number(cursor.replace("skip", ""));
      }
      newCursor = `skip${curSkip + Number(limit)}`;
    }

    return [docs, newCursor];
  }

  async create(doc: T): Promise<T> {
    try {
      await this.db.query(
        `INSERT INTO ${this.name} VALUES ($1, $2)`, //p
        [doc.id, JSON.stringify(doc)] //p
      );
    } catch (e) {
      if (e.message.includes("duplicate key value")) {
        throw new BadRequestError(e.detail);
      }
      throw e;
    }
    return doc;
  }

  async replace(doc: T) {
    const res = await this.db.query(
      `UPDATE ${this.name} SET data = $1 WHERE id = $2`,
      [JSON.stringify(doc), doc.id]
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`${this.name} id=${doc.id} not found`);
    }
  }

  async update(
    query: string | Array<SQLStatement>,
    doc: Partial<T>,
    opts: UpdateOptions = {}
  ) {
    const { throwIfEmpty = true } = opts;
    const q = sql`UPDATE `.append(this.name).append(sql`
      SET data = data || ${JSON.stringify(doc)}
    `);
    q.append(`WHERE `);
    if (Array.isArray(query)) {
      query.forEach((v, i) => {
        if (i) {
          q.append(" AND ");
        }
        q.append(v);
      });
    } else {
      q.append(sql` id = ${query}`);
    }

    const res = await this.db.query(q);

    if (res.rowCount < 1 && throwIfEmpty) {
      throw new NotFoundError(`${this.name} id=${doc.id} not found`);
    }
    return res;
  }

  // Takes in an object of {"field": number} and increases all the fields by the specified amounts
  async add(id: string, doc: Partial<T>) {
    const q = sql`UPDATE `.append(this.name).append(sql`
      SET data = data || jsonb_build_object(`);
    Object.keys(doc).forEach((k, i) => {
      if (i) {
        q.append(`, `);
      }
      q.append(`'${k}', COALESCE((data->>'${k}')::numeric, 0) + `);
      q.append(sql` ${doc[k]}`);
    });
    q.append(sql`) WHERE id = ${id}`);

    const res = await this.db.query(q);

    if (res.rowCount < 1) {
      throw new NotFoundError(`${this.name} id=${id} not found`);
    }
  }

  async delete(id: string) {
    const res = await this.db.query(`DELETE FROM ${this.name} WHERE id = $1`, [
      id,
    ]);

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} id=${id}`);
    }
  }

  async markDeleted(id: string) {
    const res = await this.db.query(
      `UPDATE ${this.name} SET data = jsonb_set(data, '{deleted}', 'true'::jsonb) WHERE id = $1`,
      [id]
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} id=${id}`);
    }
  }

  async markDeletedMany(ids: Array<string>) {
    const res = await this.db.query(
      `UPDATE ${
        this.name
      } SET data = jsonb_set(data, '{deleted}', 'true'::jsonb) WHERE id IN (${ids
        .map((_, i) => "$" + (i + 1))
        .join(",")})`,
      ids
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} ids=${ids}`);
    }
  }

  // obfuscates writeOnly fields in objects returned
  cleanWriteOnlyResponse(doc: T, schema: FieldSpec = this.schema): T {
    if (!schema.properties) {
      return doc;
    }
    const res = { ...doc };
    for (const fieldName in schema.properties) {
      const fieldSpec = schema.properties[fieldName];
      if (fieldSpec.writeOnly) {
        delete res[fieldName];
      } else if (fieldSpec.properties && res[fieldName]) {
        res[fieldName] = this.cleanWriteOnlyResponse(
          res[fieldName] as any,
          fieldSpec
        );
      }
    }
    return res;
  }

  // obfuscates writeOnly fields in array of objects returned
  cleanWriteOnlyResponses(docs: Array<T>): Array<T> {
    return docs.map((doc) => this.cleanWriteOnlyResponse(doc));
  }

  // on startup: auto-create table if it doesn't exist
  async ensureTable() {
    let res;
    try {
      res = await this.db.query(`
        SELECT * FROM ${this.name} LIMIT 0;
      `);
    } catch (e) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
      await this.db.query(`
          CREATE TABLE ${this.name} (
            id VARCHAR(128) PRIMARY KEY,
            data JSONB
          );
        `);
      logger.info(`Created table ${this.name}`);
    }
    await Promise.all(
      Object.entries(this.schema.properties).map(([propName, prop]) =>
        this.ensureIndex(propName, prop)
      )
    );
  }

  // on startup: auto-create indices if they don't exist
  async ensureIndex(propName, prop) {
    if (!prop.index && !prop.unique) {
      return;
    }
    let unique = "";
    if (prop.unique) {
      unique = "unique";
    }
    const indexName = `${this.name}_${propName}`;
    try {
      await this.db.query(`
          CREATE ${unique} INDEX "${indexName}" ON "${this.name}" USING BTREE ((data->>'${propName}'));
        `);
    } catch (e) {
      if (!e.message.includes("already exists")) {
        throw e;
      }
      return;
    }
    logger.info(`Created ${unique} index ${indexName} on ${this.name}`);
  }
}
