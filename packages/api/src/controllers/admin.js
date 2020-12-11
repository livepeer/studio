import { authMiddleware } from '../middleware'
import Router from 'express/lib/router'
import { db } from '../store'
import sql from 'sql-template-strings'

const ACTIVE_TIMEOUT = 1 * 3600 * 1000 // 1h

const app = Router()

app.post(
  '/active-clean',
  authMiddleware({ anyAdmin: true }),
  async (req, res) => {
    // check if there is streams marked 'active' but wasn't seen recently

    const query = []
    query.push(sql`data->>'isActive' = 'true'`)

    let docs, cursor
    const now = Date.now()
    const toClean = []
    res.writeHead(200)
    res.flushHeaders()
    do {
      ;[docs, cursor] = await db.stream.find(query, { cursor, limit: 100 })
      // sending progress should prevent request timing out
      res.write('.')
      for (const stream of docs) {
        const lastSeen = new Date(stream.lastSeen).getTime()
        const needClean = isNaN(lastSeen) || now - lastSeen > ACTIVE_TIMEOUT
        if (needClean) {
          toClean.push(stream)
        }
      }
    } while (cursor && docs.length === 100)
    res.write('\n')
    let i = 0
    let cleaned = 0
    for (const stream of toClean) {
      const upRes = await db.stream.update(
        stream.id,
        {
          isActive: false,
        },
        ` (data->>'lastSeen')::bigint = ${stream.lastSeen}`,
        true,
      )
      if (upRes.rowCount) {
        console.log(
          `cleaned timed out stream id=${stream.id} lastSeen=${new Date(
            stream.lastSeen,
          )} name=${stream.name}`,
        )
      }
      cleaned += upRes.rowCount
      res.write(`index=${i} cleaned=${cleaned} total=${toClean.length}\n`)
      i++
    }
    res.end(`cleaned ${cleaned} streams\n`)
  },
)

export default app
