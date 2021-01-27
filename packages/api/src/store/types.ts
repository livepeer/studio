export interface TableSchema {
  table: string;
}

export interface DBObject {
  id: string;
}

export interface DBLegacyObject extends DBObject {
  data: Object;
}

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
