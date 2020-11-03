/**
 * Special controller for forwarding all incoming requests to a geolocated API region
 */

import Router from 'express/lib/router'
import geolocateMiddleware from '../middleware/geolocate'
import fetch from 'isomorphic-fetch'
import qs from 'qs'

const app = Router()

app.use(geolocateMiddleware({ region: 'api-region' }), async (req, res) => {
  const upstreamUrl = new URL(req.region.chosenServer)
  upstreamUrl.pathname = req.originalUrl
  if (req.query) {
    upstreamUrl.search = `?${qs.stringify(req.query)}`
  }
  const upstreamHeaders = {
    ...req.headers,
    host: upstreamUrl.hostname,
  }
  // This can change slightly...
  delete upstreamHeaders['content-length']
  const params = {
    method: req.method,
    headers: upstreamHeaders,
  }
  // Oddly, req.body seems present even during GET and HEAD, so double-check
  if (
    req.body &&
    (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')
  ) {
    params.body = JSON.stringify(req.body)
  }
  const upstreamRes = await fetch(upstreamUrl.toString(), params)
  const headers = {}
  const keyVals = [...upstreamRes.headers.entries()]
  keyVals.forEach(([key, val]) => {
    res.set(key, val)
  })
  res.status(upstreamRes.status)
  if (upstreamRes.status === 204) {
    return res.end()
  }
  if (upstreamRes.status >= 200 && upstreamRes.status <= 299) {
    const resBody = await upstreamRes.json()
    res.json(resBody)
  } else {
    const resText = await upstreamRes.text()
    res.end(resText)
  }
})

export default app
