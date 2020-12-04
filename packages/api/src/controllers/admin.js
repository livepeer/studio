import { authMiddleware } from '../middleware'
import Router from 'express/lib/router'
import { db } from '../store'
import sql from 'sql-template-strings'

const ACTIVE_TIMEOUT = 24 * 3600 * 1000 // 24h

const app = Router()

app.post('/active-clean', authMiddleware({ anyAdmin: true }), async (req, res) => {
  // check if there is streams marked 'active' but wasn't seen recently

  const query = []
  query.push(sql`data->>'isActive' = 'true'`)

  let cleaned = 0
  let docs, cursor
  const now = Date.now()
  const toClean = []
  do {
    [docs, cursor] = await db.stream.find(query, { cursor, limit: 100 })
    console.log(`got ${docs.length} active streams, cursor: ${cursor}`)
    for (const stream of docs) {
        const lastSeen = +new Date(stream.lastSeen)
        const needClean = isNaN(lastSeen) ||(now - lastSeen) > ACTIVE_TIMEOUT
        console.log(`id ${stream.id} seen ${new Date(stream.lastSeen)} need clean ${needClean} name ${stream.name}`)
        if (needClean) {
            toClean.push(stream)
        }
    }
  } while (cursor && docs.length === 100)
  for (const stream of toClean) {
    await db.stream.update(stream.id, {
        isActive: false,
    })
    console.log(`stream ${stream.id} (${stream.name}) active set to false`)
    cleaned++
  }
  const msg = `cleaned ${cleaned} streams`

  res.status(200)
  res.json({ msg })
})

export default app
