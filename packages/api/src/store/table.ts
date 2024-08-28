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
import { cache } from "./cache";

const DEFAULT_SORT = "id ASC";

export interface TableOptions {
  db: DB;
  schema: TableSchema;
}

function parseLimit({ limit }: FindOptions<any>) {
  if (typeof limit === "string") {
    limit = parseInt(limit);
  }
  if (typeof limit !== "number" || isNaN(limit) || limit < 1) {
    limit = 20;
  }
  return Math.min(limit, 1000);
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
  async get(
    id: string,
    { useReplica = true, useCache }: GetOptions = {},
  ): Promise<T> {
    if (!id) {
      throw new Error("missing id");
    } else if (useCache && !useReplica) {
      throw new Error("can't cache a non-replica query");
    }

    const cacheKey = this.rowCacheKey(id);
    if (useCache) {
      const cached = cache.get<T>(cacheKey);
      if (cached) {
        return cached as T;
      }
    }

    let res: QueryResult<DBLegacyObject>;
    if (!useReplica) {
      res = await this.db.query(
        sql`SELECT data FROM `
          .append(this.name)
          .append(sql` WHERE id=${id}`.setName(`${this.name}_by_id`)),
      );
    } else {
      res = await this.db.replicaQuery(
        sql`SELECT data FROM `
          .append(this.name)
          .append(sql` WHERE id=${id}`.setName(`${this.name}_by_id`)),
      );
    }

    if (res.rowCount < 1) {
      return null;
    }

    const data = res.rows[0].data as T;
    // always cache on read, even if not returning from cache
    cache.set(cacheKey, data);

    return data;
  }

  async getMany(
    ids: Array<string>,
    opts: GetOptions = { useReplica: true },
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
      opts,
    );

    if (res.rowCount < 1) {
      return null;
    }
    return res.rows.map((o) => o.data as T);
  }

  // returns [docs, cursor]
  async find<Q = T>(
    query: FindQuery | Array<SQLStatement> = {},
    opts: FindOptions<Q> = {},
  ): Promise<[Array<Q>, string]> {
    const {
      cursor = "",
      useReplica = true,
      order = DEFAULT_SORT,
      fields = "*",
      from = this.name,
      process,
    } = opts;
    const limit = parseLimit(opts);

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
        sql``.append(this.name + ".").append(sql`data->>'id' > ${cursor}`),
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

    if (order) {
      q.append(` ORDER BY ${order}`);
    }
    if (limit) {
      q.append(sql` LIMIT ${limit}`);
    }
    if (cursor && cursor.includes("skip")) {
      q.append(sql` OFFSET ${cursor.replace("skip", "")}`);
    }

    let res: QueryResult;
    if (useReplica) {
      res = await this.db.replicaQuery(q);
    } else {
      res = await this.db.query(q);
    }

    const docs = res.rows.map(process ? process : ({ data }) => data as Q);

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
        [doc.id, JSON.stringify(doc)], //p
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
      [JSON.stringify(doc), doc.id],
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`${this.name} id=${doc.id} not found`);
    }

    cache.set(this.rowCacheKey(doc.id), doc);
  }

  async update(
    query: string | Array<SQLStatement>,
    doc: Partial<T>,
    opts: UpdateOptions = {},
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

    if (typeof query === "string") {
      cache.delete(this.rowCacheKey(query));
    }

    if (res.rowCount < 1 && throwIfEmpty) {
      throw new NotFoundError(`${this.name} id=${doc.id} not found`);
    }
    return res;
  }

  // Takes in an object of {"field": number} and increases all the fields by the
  // specified amounts. Also supports receiving a `set` object for fields that
  // shouldn't be added but just set directly.
  async add(id: string, add: Partial<T>, set?: Partial<T>) {
    const q = sql`UPDATE `.append(this.name).append(sql`
      SET data = data || jsonb_build_object(`);
    Object.keys(add).forEach((k, i) => {
      if (i) {
        q.append(`, `);
      }
      q.append(`'${k}', COALESCE((data->>'${k}')::numeric, 0) + `);
      q.append(sql` ${add[k]}`);
    });
    q.append(`)`);
    if (set) {
      q.append(sql` || ${JSON.stringify(set)}`);
    }
    q.append(sql` WHERE id = ${id}`);

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
      [id],
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
      ids,
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} ids=${ids}`);
    }
  }

  // obfuscates writeOnly fields in objects returned
  cleanWriteOnlyResponse(doc: T, schema: FieldSpec = this.schema): T {
    if (schema.oneOf?.length) {
      for (const oneSchema of schema.oneOf) {
        doc = this.cleanWriteOnlyResponse(doc, oneSchema);
      }
    }
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
          fieldSpec,
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
    for (const [propName, prop] of Object.entries(this.schema.properties)) {
      await this.ensureIndex(propName, prop);
    }
  }

  // on startup: auto-create indices if they don't exist
  async ensureIndex(propName: string, prop: FieldSpec, parents: string[] = []) {
    if (prop.oneOf?.length) {
      for (const oneSchema of prop.oneOf) {
        await this.ensureIndex(propName, oneSchema, parents);
      }
      return;
    }

    if (!prop.index && !prop.unique) {
      // Tasks embed a bunch of `asset` objects in different fields. This would
      // mean we'd duplicate the asset indexes in the task table. Because of
      // that, we disable recursive indexes for the `task` table.
      if (prop.properties && this.name !== "task") {
        const childProps = Object.entries(prop.properties);
        for (const [childName, childProp] of childProps) {
          await this.ensureIndex(childName, childProp, [...parents, propName]);
        }
        return;
      }
      return;
    }
    let unique = "";
    if (prop.unique) {
      unique = "unique";
    }
    const indexType = prop.indexType?.toUpperCase() || "BTREE";
    if (!["GIN", "BTREE"].includes(indexType)) {
      throw new Error(`unknown index type ${indexType} for ${propName}}`);
    }
    const indexName = `${this.name}_${[...parents, propName].join("_")}`;

    const parentsAcc = parents.map((p) => `->'${p}'`).join("");
    const propAccessOp = indexType === "GIN" ? "->" : "->>";
    const propAccessor = `data${parentsAcc}${propAccessOp}'${propName}'`;
    try {
      await this.db.query(`
          CREATE ${unique} INDEX CONCURRENTLY "${indexName}" ON "${this.name}" USING ${indexType} ((${propAccessor}));
        `);
    } catch (e) {
      if (!e.message.includes("already exists")) {
        throw e;
      }
      return;
    }
    logger.info(`Created ${unique} index ${indexName} on ${this.name}`);
  }

  private rowCacheKey(id: string) {
    return `db-get-${this.name}-by-id-${id}`;
  }
}
