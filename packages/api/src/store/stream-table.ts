import sql, { SQLStatement } from 'sql-template-strings'
import Table from './table'
import { Stream } from '../schema/types'
import { QueryArrayResult, QueryResult, QueryResultRow } from 'pg'

import { TableSchema, GetOptions, DBObject, FindQuery, FindOptions } from './types'

interface UsageData {
  sourceSegments: number
  transcodedSegments: number
  sourceSegmentsDuration: number
  transcodedSegmentsDuration: number
}

interface dbUsageData extends QueryResultRow {
  sourcesegments: string
  transcodedsegments: string
  sourcesegmentsduration: number
  transcodedsegmentsduration: number
}

export default class StreamTable extends Table<Stream> {


  async usage(userId: string, fromTime: number, toTime: number,
    opts: FindOptions = {},
  ): Promise<UsageData> {
    const { cursor = '', limit = 100, useReplica = true } = opts
    const q1 = sql`SELECT 
      sum((data->>'sourceSegmentsDuration')::float) as sourceSegmentsDuration,
      sum((data->>'transcodedSegmentsDuration')::float) as transcodedSegmentsDuration,
      sum((data->>'sourceSegments')::numeric) as sourceSegments,
      sum((data->>'transcodedSegments')::int) as transcodedSegments
    
    FROM stream WHERE data->>'userId' = ${userId}
      AND data->>'sourceSegmentsDuration' IS NOT NULL 
      AND data->>'parentId' IS NOT NULL 
      AND data->>'createdAt' >= ${fromTime}
      AND data->>'createdAt' < ${toTime}
    `

    const usage = {
      sourceSegments: 0,
      transcodedSegments: 0,
      sourceSegmentsDuration: 0,
      transcodedSegmentsDuration: 0,
    }

    let res: QueryResult<dbUsageData>
    if (!opts.useReplica) {
      res = await this.db.query(q1)
    } else {
      res = await this.db.replicaQuery(q1)
    }
    if (res.rowCount > 0) {
      const dbUsage = res.rows[0]
      usage.sourceSegments += parseInt(dbUsage.sourcesegments)
      usage.transcodedSegments += parseInt(dbUsage.transcodedsegments)
      usage.sourceSegmentsDuration += dbUsage.sourcesegmentsduration
      usage.transcodedSegmentsDuration += dbUsage.transcodedsegmentsduration
    }
    const q2 = sql`SELECT 
      sum((data->>'sourceSegmentsDuration')::float) as sourceSegmentsDuration,
      sum((data->>'transcodedSegmentsDuration')::float) as transcodedSegmentsDuration,
      sum((data->>'sourceSegments')::numeric) as sourceSegments,
      sum((data->>'transcodedSegments')::int) as transcodedSegments
    
    FROM stream S WHERE data->>'userId' = ${userId}
      AND data->>'sourceSegmentsDuration' IS NOT NULL
      AND data->>'parentId' IS NULL
      AND (SELECT COUNT(C.id) FROM stream C WHERE C.data->>'parentId' = S.Id) = 0
      AND data->>'createdAt' >= ${fromTime}
      AND data->>'createdAt' < ${toTime}
    `
    if (!opts.useReplica) {
      res = await this.db.query(q2)
    } else {
      res = await this.db.replicaQuery(q2)
    }
    if (res.rowCount > 0) {
      const dbUsage = res.rows[0]
      usage.sourceSegments += parseInt(dbUsage.sourcesegments)
      usage.transcodedSegments += parseInt(dbUsage.transcodedsegments)
      usage.sourceSegmentsDuration += dbUsage.sourcesegmentsduration
      usage.transcodedSegmentsDuration += dbUsage.transcodedsegmentsduration
    }
    return usage
  }
}
