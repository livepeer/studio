export interface FieldSpec {
  [key: string]: any;
  index?: boolean;
  indexType?: string; // "btree" | "gin", defaults to "btree"
  unique?: boolean;
  writeOnly?: boolean;
  oneOf?: FieldSpec[];
  properties?: Record<string, FieldSpec>;
}

export interface TableSchema {
  table: string;
  properties: Record<string, FieldSpec>;
}

export interface DBObject {
  id: string;
}

export interface DBLegacyObject extends DBObject {
  data: Object;
}

export type WithID<T> = T & { id: string };

export interface FindQuery {
  [key: string]: any;
}

export interface QueryOptions {
  useReplica?: boolean;
}

export interface FindOptions<T = never> extends QueryOptions {
  cursor?: string;
  limit?: number | string;
  order?: string;
  fields?: string;
  from?: string;
  process?: (row: any) => T;
}

export interface GetOptions {
  useReplica?: boolean;
}

export interface UpdateOptions {
  throwIfEmpty?: boolean;
}
