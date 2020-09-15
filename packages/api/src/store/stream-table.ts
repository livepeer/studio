import sql, { SQLStatement } from 'sql-template-strings'
import Table from './table'
import { Stream } from '../schema/types'
import { QueryArrayResult, QueryResult, QueryResultRow } from 'pg'

import { DBLegacyObject, FindOptions, QueryOptions } from './types'

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
    opts: QueryOptions = {},
  ): Promise<UsageData> {
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
    res = await this.db.queryWithOpts(q1, opts)
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
    res = await this.db.queryWithOpts(q2, opts)
    if (res.rowCount > 0) {
      const dbUsage = res.rows[0]
      usage.sourceSegments += parseInt(dbUsage.sourcesegments)
      usage.transcodedSegments += parseInt(dbUsage.transcodedsegments)
      usage.sourceSegmentsDuration += dbUsage.sourcesegmentsduration
      usage.transcodedSegmentsDuration += dbUsage.transcodedsegmentsduration
    }
    return usage
  }

  async getByStreamKey(streamKey: string, opts: QueryOptions = {}): Promise<Stream> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT data FROM stream  WHERE data->>'streamKey'=${streamKey}`.setName(`${this.name}_by_streamKey`),
      opts
    )
    return res.rowCount < 1 ? null : res.rows[0].data as Stream
  }

  async getByPlaybackId(playbackId: string, opts: QueryOptions = {}): Promise<Stream> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT data FROM stream  WHERE data->>'playbackId'=${playbackId}`.setName(`${this.name}_by_playbackid`),
      opts
    )
    return res.rowCount < 1 ? null : res.rows[0].data as Stream
  }

  async getLastSession(id: string, opts: QueryOptions = {}): Promise<Stream> {
    const res: QueryResult<DBLegacyObject> = await this.db.queryWithOpts(
      sql`SELECT data FROM stream  WHERE data->>'parentId'=${id} ORDER BY data->>'createdAt' DESC LIMIT 1`
        .setName(`${this.name}_by_parentid_last_session`),
      opts
    )
    return res.rowCount < 1 ? null : res.rows[0].data as Stream
  }
}
