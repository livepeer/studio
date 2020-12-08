import Router from 'express/lib/router'
import { authMiddleware } from '../middleware'

const app = Router()

const getOrchestrators = async (req, res, next) => {
  const orchestrators = await req.getOrchestrators(req)

  return res.json(orchestrators.map(({ address }) => ({ address })))
}

app.get('/:region', authMiddleware({ admin: true }), async (req, res, next) => {
  const region = await req.store.get(`region/${req.params.region}`)
  return res.json(region)
})

app.post(
  '/:region',
  authMiddleware({ admin: true }),
  async (req, res, next) => {
    if (!req.body || !req.body.region) {
      res.status(406)
      return res.json({ error: 'region field is required' })
    }

    if (!req.body.orchestrators || !req.body.orchestrators.length) {
      console.log(`WARNING req.body.orchestrators is undefined`)
    }

    let region = {
      region: req.body.region,
      orchestrators: req.body.orchestrators || [],
    }

    console.log(`req.body ${JSON.stringify(req.body)}`)
    const resp = await req.store.create({
      id: region.region,
      kind: 'region',
      ...region,
    })

    return res.json(region)
  },
)

app.delete(
  '/:region',
  authMiddleware({ admin: true }),
  async (req, res, next) => {
    const resp = await req.store.delete(`region/${req.params.region}`)
    return res.json({ ok: 1 })
  },
)

app.get('/orchestrator', getOrchestrators)

export default app
