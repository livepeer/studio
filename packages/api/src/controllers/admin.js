import { authMiddleware } from '../middleware'
import Router from 'express/lib/router'
import { db } from '../store'
import sql from 'sql-template-strings'
import consul from 'consul'

const ACTIVE_TIMEOUT = 5 * 60 * 1000 // 5min

const app = Router()
const traefikKeyPathRouters = `traefik/http/routers/`
const traefikKeyPathServices = `traefik/http/services/`
const traefikKeyPathMiddlewares = `traefik/http/middlewares/`

app.post(
  '/consul-routes-clean',
  authMiddleware({ anyAdmin: true }),
  async (req, res) => {
    // check if there is routes in the consul that belongs to the streams that
    // are not active anymore
    let baseUrl
    if (req.config.consul) {
      baseUrl = req.config.consul
      if (!baseUrl.endsWith('/v1')) {
        baseUrl += '/v1'
      }
    } else {
      res.status(501)
      return res.end()
    }
    const cc = consul({ promisify: true, baseUrl })
    let keys
    try {
      keys = await cc.kv.keys({
        key: traefikKeyPathRouters,
        separator: '/',
      })
      keys = keys.map((k) => k.split('/')[3])
    } catch (e) {
      if (e.statusCode == 404) {
        return res.json({ msg: 'no keys' })
      } else {
        console.log(`error getting keys:`, e)
        res.statusCode = 500
        return res.json({ errors: [String(e)] })
      }
    }
    let i = 0,
      found = 0
    const toClean = []
    const now = Date.now()
    for (const key of keys) {
      const stream = await db.stream.getByPlaybackId(key)
      if (stream) {
        const lastSeen = new Date(stream.lastSeen).getTime()
        const needClean = !stream.isActive && now - lastSeen > ACTIVE_TIMEOUT
        found++
        if (needClean) {
          toClean.push(key)
        }
      }
      const msg = `${i}/${found}/${keys.length}`
      res.write(msg + '\n')
      i++
    }
    let cleaned = 0
    i = 0
    for (const key of toClean) {
      const keysResp = await cc.transaction.create([
        {
          KV: {
            Verb: 'get-tree',
            Key: traefikKeyPathRouters + key,
          },
        },
        {
          KV: {
            Verb: 'get-tree',
            Key: traefikKeyPathServices + key,
          },
        },
        {
          KV: {
            Verb: 'get-tree',
            Key: traefikKeyPathMiddlewares + key,
          },
        },
      ])
      if (keysResp && keysResp.Results) {
        // deleting keys
        // 'delete-cas' will not delete key in case it was
        // modified after we've read it
        // (could happend if stream started after we've read key)
        const deleteTxn = keysResp.Results.map((rk) => {
          return {
            KV: {
              Verb: 'delete-cas',
              Key: rk.KV.Key,
              Index: rk.KV.ModifyIndex,
            },
          }
        })
        let deleteResp
        try {
          deleteResp = await cc.transaction.create(deleteTxn)
        } catch (e) {
          if (e.statusCode !== 409) {
            console.error(`Error deleting keys: `, e)
          }
        }
        if (deleteResp && !deleteResp.Errors) {
          cleaned++
          console.log(`cleaned routes for ${key}`)
        }
      }
      const msg = `${i}/${cleaned}/${toClean.length}`
      res.write(msg + '\n')
      i++
    }
    res.end(`cleaned routes for ${cleaned}/${toClean.length} streams\n`)
  },
)

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
      const upRes = await setActiveToFalse(stream)
      cleaned += upRes.rowCount
      res.write(`index=${i} cleaned=${cleaned} total=${toClean.length}\n`)
      i++
    }
    res.end(`cleaned ${cleaned} streams\n`)
  },
)

export async function setActiveToFalse(stream) {
  let upRes
  try {
    upRes = await db.stream.update(
      [
        sql`id = ${stream.id}`,
        sql`(data->>'lastSeen')::bigint = ${stream.lastSeen}`,
      ],
      { isActive: false },
      { throwIfEmpty: false },
    )
    if (upRes.rowCount) {
      console.log(
        `cleaned timed out stream id=${stream.id} lastSeen=${new Date(
          stream.lastSeen,
        )} name=${stream.name}`,
      )
    }
  } catch (e) {
    console.error(
      `error setting stream active to false id=${stream.id} name=${stream.name} err=${e}`,
    )
    upRes = { rowCount: 0 }
  }
  return upRes
}

export default app
