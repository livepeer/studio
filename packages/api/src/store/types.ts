
export interface TableSchema {
  table: string
}

export interface DBObject {
  id: string
}

export interface FindQuery {
  [key: string]: any
}

export interface FindOptions {
  cursor?: string
  limit?: number
  useReplica?: boolean
}

export interface GetOptions {
  useReplica?: boolean
}
