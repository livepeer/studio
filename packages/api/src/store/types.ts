export interface FieldSpec {
  [key: string]: any;
  writeOnly?: boolean;
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

export interface FindOptions extends QueryOptions {
  cursor?: string;
  limit?: number;
  order?: string;
  fields?: string;
  from?: string;
  process?: Function;
}

export interface GetOptions {
  useReplica?: boolean;
}

export interface UpdateOptions {
  throwIfEmpty?: boolean;
}
