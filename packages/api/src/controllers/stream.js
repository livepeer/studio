import { parse as parseUrl } from 'url'
import { authMiddleware } from '../middleware'
import { validatePost } from '../middleware'
import Router from 'express/lib/router'
import logger from '../logger'
import uuid from 'uuid/v4'
import wowzaHydrate from './wowza-hydrate'
import { fetchWithTimeout } from '../util'
import { makeNextHREF, trackAction, getWebhooks } from './helpers'
import { generateStreamKey } from './generate-stream-key'
import { geolocateMiddleware } from '../middleware'
import { getBroadcasterHandler } from './broadcaster'
import { db } from '../store'
import sql from 'sql-template-strings'

const WEBHOOK_TIMEOUT = 5 * 1000
const USER_SESSION_TIMEOUT = 5 * 60 * 1000 // 5 min

const isLocalIP = require('is-local-ip')
const { Resolver } = require('dns').promises
const resolver = new Resolver()

const app = Router()
const hackMistSettings = (req, profiles) => {
  if (
    !req.headers['user-agent'] ||
    !req.headers['user-agent'].toLowerCase().includes('mistserver')
  ) {
    return profiles
  }
  profiles = profiles || []
  return profiles.map((profile) => {
    profile = {
      ...profile,
    }
    if (typeof profile.gop === 'undefined') {
      profile.gop = '2.0'
    }
    if (typeof profile.fps === 'undefined') {
      profile.fps = 0
    }
    return profile
  })
}

app.get('/', authMiddleware({ admin: true }), async (req, res) => {
  let { limit, cursor, streamsonly, sessionsonly, all, active } = req.query

  const query = []
  if (!all) {
    query.push(sql`data->>'deleted' IS NULL`)
  }
  if (streamsonly) {
    query.push(sql`data->>'parentId' IS NULL`)
  } else if (sessionsonly) {
    query.push(sql`data->>'parentId' IS NOT NULL`)
  }
  if (active) {
    query.push(sql`data->>'isActive' = 'true'`)
  }

  const [output, newCursor] = await db.stream.find(query, { cursor, limit })

  res.status(200)

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) })
  }
  res.json(output)
})

app.get('/sessions/:parentId', authMiddleware({}), async (req, res) => {
  const { parentId, limit, cursor } = req.params
  logger.info(`cursor params ${cursor}, limit ${limit}`)

  const stream = await req.store.get(`stream/${parentId}`)
  if (
    !stream ||
    stream.deleted ||
    (stream.userId !== req.user.id && !req.isUIAdmin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }

  const { data: streams, cursor: cursorOut } = await req.store.queryObjects({
    kind: 'stream',
    query: { parentId },
    cursor,
    limit,
  })
  res.status(200)
  if (streams.length > 0 && cursorOut) {
    res.links({ next: makeNextHREF(req, cursorOut) })
  }
  res.json(streams)
})

app.get('/user/:userId', authMiddleware({}), async (req, res) => {
  const { userId } = req.params
  let { limit, cursor, streamsonly, sessionsonly } = req.query

  if (req.user.admin !== true && req.user.id !== req.params.userId) {
    res.status(403)
    return res.json({
      errors: ['user can only request information on their own streams'],
    })
  }

  const query = [
    sql`data->>'deleted' IS NULL`,
    sql`data->>'userId' = ${userId}`,
  ]
  if (streamsonly) {
    query.push(sql`data->>'parentId' IS NULL`)
  } else if (sessionsonly) {
    query.push(sql`data->>'parentId' IS NOT NULL`)
  }

  const [streams, newCursor] = await db.stream.find(query, { cursor, limit })

  res.status(200)

  if (newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) })
  }
  res.json(streams)
})

app.get('/:id', authMiddleware({}), async (req, res) => {
  const stream = await req.store.get(`stream/${req.params.id}`)
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.isUIAdmin)
  ) {
    // do not reveal that stream exists
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  res.status(200)
  res.json(stream)
})

// returns stream by steamKey
app.get('/playback/:playbackId', authMiddleware({}), async (req, res) => {
  console.log(`headers:`, req.headers)
  const {
    data: [stream],
  } = await req.store.queryObjects({
    kind: 'stream',
    query: { playbackId: req.params.playbackId },
  })
  if (
    !stream ||
    ((stream.userId !== req.user.id || stream.deleted) && !req.user.admin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  res.status(200)
  res.json(stream)
})

// returns stream by steamKey
app.get('/key/:streamKey', authMiddleware({}), async (req, res) => {
  const useReplica = req.query.main !== 'true'
  const [docs] = await db.stream.find(
    { streamKey: req.params.streamKey },
    { useReplica },
  )
  if (
    !docs.length ||
    ((docs[0].userId !== req.user.id || docs[0].deleted) && !req.user.admin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  res.status(200)
  res.json(docs[0])
})

// Needed for Mist server
app.get(
  '/:streamId/broadcaster',
  geolocateMiddleware({}),
  getBroadcasterHandler,
)

async function generateUniqueStreamKey(store, otherKeys) {
  while (true) {
    const streamId = await generateStreamKey()
    const qres = await store.query({
      kind: 'stream',
      query: { streamId },
    })
    if (!qres.data.length && !otherKeys.includes(streamId)) {
      return streamId
    }
  }
}

app.post(
  '/:streamId/stream',
  authMiddleware({}),
  validatePost('stream'),
  async (req, res) => {
    if (!req.body || !req.body.name) {
      res.status(422)
      return res.json({
        errors: ['missing name'],
      })
    }

    const stream = await req.store.get(`stream/${req.params.streamId}`)
    if (
      !stream ||
      ((stream.userId !== req.user.id || stream.deleted) &&
        !(req.user.admin && !stream.deleted))
    ) {
      // do not reveal that stream exists
      res.status(404)
      return res.json({ errors: ['not found'] })
    }

    // The first four letters of our playback id are the shard key.
    const id = stream.playbackId.slice(0, 4) + uuid().slice(4)
    const createdAt = Date.now()

    let previousSessions
    if (stream.record && req.config.recordObjectStoreId) {
      // find previous sessions to form 'user' session
      const tooOld = createdAt - USER_SESSION_TIMEOUT
      const query = []
      query.push(sql`data->>'parentId' = ${stream.id}`)
      query.push(sql`data->>'lastSeen' > ${tooOld}`)

      const [prevSessionsDocs] = await db.stream.find(query, {
        order: `data->>'lastSeen' DESC`,
      })
      if (
        prevSessionsDocs.length &&
        (!prevSessionsDocs[0].recordObjectStoreId ||
          prevSessionsDocs[0].recordObjectStoreId ==
            req.config.recordObjectStoreId)
      ) {
        previousSessions = prevSessionsDocs[0].previousSessions
        if (!Array.isArray(previousSessions)) {
          previousSessions = []
        }
        previousSessions.push(prevSessionsDocs[0].id)
        setImmediate(() => {
          db.stream.update(prevSessionsDocs[0].id, {
            partialSession: true,
          })
        })
      }
    }

    const doc = wowzaHydrate({
      ...req.body,
      kind: 'stream',
      userId: stream.userId,
      renditions: {},
      objectStoreId: stream.objectStoreId,
      recordObjectStoreId: stream.recordObjectStoreId,
      record: stream.record,
      id,
      createdAt,
      parentId: stream.id,
      previousSessions,
    })

    doc.profiles = hackMistSettings(req, doc.profiles)

    try {
      await req.store.create(doc)
      trackAction(
        req.user.id,
        req.user.email,
        { name: 'Stream Session Created' },
        req.config.segmentApiKey,
      )
    } catch (e) {
      console.error(e)
      throw e
    }
    res.status(201)
    res.json(doc)
  },
)

app.post('/', authMiddleware({}), validatePost('stream'), async (req, res) => {
  if (!req.body || !req.body.name) {
    res.status(422)
    return res.json({
      errors: ['missing name'],
    })
  }
  const id = uuid()
  const createdAt = Date.now()
  let streamKey = await generateUniqueStreamKey(req.store, [])
  // Mist doesn't allow dashes in the URLs
  let playbackId = (
    await generateUniqueStreamKey(req.store, [streamKey])
  ).replace(/-/g, '')

  // use the first four characters of the id as the "shard key" across all identifiers
  const shardKey = id.slice(0, 4)
  streamKey = shardKey + streamKey.slice(4)
  playbackId = shardKey + playbackId.slice(4)

  let objectStoreId
  if (req.body.objectStoreId) {
    const store = await req.store.get(`object-store/${req.body.objectStoreId}`)
    if (!store) {
      res.status(400)
      return res.json({
        errors: [`object-store ${req.body.objectStoreId} does not exist`],
      })
    }
  }

  const doc = wowzaHydrate({
    ...req.body,
    kind: 'stream',
    userId: req.user.id,
    renditions: {},
    objectStoreId,
    id,
    createdAt,
    streamKey,
    playbackId,
    createdByTokenName: req.tokenName,
  })

  doc.profiles = hackMistSettings(req, doc.profiles)

  await Promise.all([
    req.store.create(doc),
    trackAction(
      req.user.id,
      req.user.email,
      { name: 'Stream Created' },
      req.config.segmentApiKey,
    ),
  ])

  res.status(201)
  res.json(doc)
})

app.put('/:id/setactive', authMiddleware({}), async (req, res) => {
  const { id } = req.params
  // logger.info(`got /setactive/${id}: ${JSON.stringify(req.body)}`)
  const stream = await req.store.get(`stream/${id}`, false)
  if (!stream || stream.deleted || !req.user.admin) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }

  if (req.body.active) {
    // trigger the webhooks, reference https://github.com/livepeer/livepeerjs/issues/791#issuecomment-658424388
    // this could be used instead of /webhook/:id/trigger (althoughs /trigger requires admin access )

    // basic sanitization.
    let sanitized = { ...stream }
    delete sanitized.streamKey

    const { data: webhooksList } = await getWebhooks(
      req.store,
      stream.userId,
      'streamStarted',
    )
    try {
      const responses = await Promise.all(
        webhooksList.map(async (webhook, key) => {
          // console.log('webhook: ', webhook)
          console.log(`trying webhook ${webhook.name}: ${webhook.url}`)
          let ips, urlObj, isLocal
          try {
            urlObj = parseUrl(webhook.url)
            if (urlObj.host) {
              ips = await resolver.resolve4(urlObj.hostname)
            }
          } catch (e) {
            console.error('error: ', e)
            throw e
          }

          // This is mainly useful for local testing
          if (req.user.admin) {
            isLocal = false
          } else {
            try {
              if (ips && ips.length) {
                isLocal = isLocalIP(ips[0])
              } else {
                isLocal = true
              }
            } catch (e) {
              console.error('isLocal Error', isLocal, e)
              throw e
            }
          }
          if (isLocal) {
            // don't fire this webhook.
            console.log(
              `webhook ${webhook.id} resolved to a localIP, url: ${webhook.url}, resolved IP: ${ips}`,
            )
          } else {
            console.log('preparing to fire webhook ', webhook.url)
            // go ahead
            let params = {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'user-agent': 'livepeer.com',
              },
              timeout: WEBHOOK_TIMEOUT,
              body: JSON.stringify({
                id: webhook.id,
                event: webhook.event,
                stream: sanitized,
              }),
            }

            try {
              logger.info(`webhook ${webhook.id} firing`)
              let resp = await fetchWithTimeout(webhook.url, params)
              if (resp.status >= 200 && resp.status < 300) {
                // 2xx requests are cool.
                // all is good
                logger.info(`webhook ${webhook.id} fired successfully`)
                return true
              }
              console.error(
                `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`,
              )
              return !webhook.blocking
            } catch (e) {
              console.log('firing error', e)
              return !webhook.blocking
            }
          }
        }),
      )
      if (responses.some((o) => !o)) {
        // at least one of responses is false, blocking this stream
        res.status(403)
        return res.end()
      }
    } catch (e) {
      console.error('webhook loop error', e)
      res.status(400)
      return res.end()
    }
  }

  stream.isActive = !!req.body.active
  stream.lastSeen = +new Date()
  await db.stream.update(stream.id, {
    isActive: stream.isActive,
    lastSeen: stream.lastSeen,
  })

  if (stream.parentId) {
    const pStream = await req.store.get(`stream/${id}`, false)
    if (pStream && !pStream.deleted) {
      await db.stream.update(pStream.id, {
        isActive: stream.isActive,
        lastSeen: stream.lastSeen,
      })
    }
  }

  res.status(204)
  res.end()
})

app.patch('/:id/record', authMiddleware({}), async (req, res) => {
  const { id } = req.params
  const stream = await req.store.get(`stream/${id}`, false)
  if (!stream || stream.deleted) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  if (stream.parentId) {
    res.status(400)
    return res.json({ errors: ["can't set for session"] })
  }
  if (req.body.record === undefined) {
    res.status(400)
    return res.json({ errors: ['record field required'] })
  }
  console.log(`set stream ${id} record ${req.body.record}`)

  await db.stream.update(stream.id, { record: !!req.body.record })

  res.status(204)
  res.end()
})

app.delete('/:id', authMiddleware({}), async (req, res) => {
  const { id } = req.params
  const stream = await req.store.get(`stream/${id}`, false)
  if (
    !stream ||
    stream.deleted ||
    (stream.userId !== req.user.id && !req.isUIAdmin)
  ) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }

  await db.stream.update(stream.id, {
    deleted: true,
  })
  res.status(204)
  res.end()
})

app.delete('/', authMiddleware({}), async (req, res) => {
  if (!req.body || !req.body.ids || !req.body.ids.length) {
    res.status(422)
    return res.json({
      errors: ['missing ids'],
    })
  }
  const ids = req.body.ids

  if (!req.user.admin) {
    const streams = await db.stream.getMany(ids)
    if (
      streams.length !== ids.length ||
      streams.some((s) => s.userId !== req.user.id)
    ) {
      res.status(404)
      return res.json({ errors: ['not found'] })
    }
  }
  await db.stream.markDeletedMany(ids)

  res.status(204)
  res.end()
})

app.get('/:id/info', authMiddleware({}), async (req, res) => {
  let { id } = req.params
  let stream = await db.stream.getByStreamKey(id)
  let session,
    isPlaybackid = false,
    isStreamKey = !!stream,
    isSession = false
  if (!stream) {
    stream = await db.stream.getByPlaybackId(id)
    isPlaybackid = !!stream
  }
  if (!stream) {
    stream = await db.stream.get(id)
  }
  if (stream && stream.parentId) {
    session = stream
    isSession = true
    stream = await db.stream.get(stream.parentId)
  }
  if (
    !stream ||
    (!req.user.admin && (stream.deleted || stream.userId !== req.user.id))
  ) {
    res.status(404)
    return res.json({
      errors: ['not found'],
    })
  }
  if (!session) {
    // find last session
    session = await db.stream.getLastSession(stream.id)
  }
  const user = await req.store.get(`user/${stream.userId}`)
  const resp = {
    stream,
    session,
    isPlaybackid,
    isSession,
    isStreamKey,
    user: req.user.admin ? user : undefined,
  }

  res.status(200)
  res.json(resp)
})

app.post('/hook', async (req, res) => {
  if (!req.body || !req.body.url) {
    res.status(422)
    return res.json({
      errors: ['missing url'],
    })
  }
  // logger.info(`got webhook: ${JSON.stringify(req.body)}`)
  // These are of the form /live/:manifestId/:segmentNum.ts
  let { pathname, protocol } = parseUrl(req.body.url)
  // Protocol is sometimes undefined, due to https://github.com/livepeer/go-livepeer/issues/1006
  if (!protocol) {
    protocol = 'http:'
  }
  if (protocol === 'https:') {
    protocol = 'http:'
  }
  if (protocol !== 'http:' && protocol !== 'rtmp:') {
    res.status(422)
    return res.json({ errors: [`unknown protocol: ${protocol}`] })
  }

  // Allowed patterns, for now:
  // http(s)://broadcaster.example.com/live/:streamId/:segNum.ts
  // rtmp://broadcaster.example.com/live/:streamId
  const [live, streamId, ...rest] = pathname.split('/').filter((x) => !!x)
  // logger.info(`live=${live} streamId=${streamId} rest=${rest}`)

  if (!streamId) {
    res.status(401)
    return res.json({ errors: ['stream key is required'] })
  }
  if (protocol === 'rtmp:' && rest.length > 0) {
    res.status(422)
    return res.json({
      errors: [
        'RTMP address should be rtmp://example.com/live. Stream key should be a UUID.',
      ],
    })
  }
  if (protocol === 'http:' && rest.length > 3) {
    res.status(422)
    return res.json({
      errors: [
        'acceptable URL format: http://example.com/live/:streamId/:number.ts',
      ],
    })
  }

  if (live !== 'live' && live !== 'recordings') {
    res.status(404)
    return res.json({ errors: ['ingest url must start with /live/'] })
  }

  const stream = await req.store.get(`stream/${streamId}`, false)
  if (!stream) {
    res.status(404)
    return res.json({ errors: ['not found'] })
  }
  let objectStore,
    recordObjectStore = undefined,
    recordObjectStoreUrl
  if (stream.objectStoreId) {
    const os = await req.store.get(
      `object-store/${stream.objectStoreId}`,
      false,
    )
    if (!os) {
      res.status(500)
      return res.json({
        errors: [
          `data integity error: object store ${stream.objectStoreId} not found`,
        ],
      })
    }
    objectStore = os.url
  }
  const isLive = live === 'live'
  if (
    isLive &&
    stream.record &&
    req.config.recordObjectStoreId &&
    !stream.recordObjectStoreId
  ) {
    await db.stream.update(stream.id, {
      recordObjectStoreId: req.config.recordObjectStoreId,
    })
    stream.recordObjectStoreId = req.config.recordObjectStoreId
  }
  if (stream.recordObjectStoreId) {
    const ros = await req.store.get(
      `object-store/${stream.recordObjectStoreId}`,
      false,
    )
    if (!ros) {
      res.status(500)
      return res.json({
        errors: [
          `data integity error: record object store ${stream.recordObjectStoreId} not found`,
        ],
      })
    }
    recordObjectStore = ros.url
    if (ros.publicUrl) {
      recordObjectStoreUrl = ros.publicUrl
    }
  }

  // Use our parents' playbackId for sharded playback
  let manifestID = streamId
  if (stream.parentId) {
    const parent = await db.stream.get(stream.parentId)
    manifestID = parent.playbackId
  }

  res.json({
    manifestID: manifestID,
    presets: stream.presets,
    profiles: stream.profiles,
    objectStore,
    recordObjectStore,
    recordObjectStoreUrl,
    previousSessions: stream.previousSessions,
  })
})

export default app
