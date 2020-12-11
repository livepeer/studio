import Router from 'express/lib/router'
import { authMiddleware } from '../middleware'
import { db } from '../store'

const app = Router()

app.get('/', authMiddleware({ admin: true }), async (req, res, next) => {
  const [regions, cursor] = await db.region.find()
  if (req.query.grouped) {
    return res.json(regions)
  }

  const flatOrchList = []
  regions.forEach((region) => {
    region.orchestrators.forEach((orch) => {
      orch.region = region.region
      flatOrchList.push(orch)
    })
  })

  return res.json(flatOrchList)
})

app.get('/:region', authMiddleware({ admin: true }), async (req, res, next) => {
  const region = await db.region.get(req.params.region)
  return res.json(region)
})

app.put('/:region', authMiddleware({ admin: true }), async (req, res, next) => {
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

  const resp = await db.region.create({
    id: region.region,
    kind: 'region',
    region: region.region,
    orchestrators: region.orchestrators,
  })

  return res.json(region)
})

app.delete(
  '/:region',
  authMiddleware({ admin: true }),
  async (req, res, next) => {
    const resp = await db.region.delete(`region/${req.params.region}`)
    return res.json({ ok: 1 })
  },
)

export default app
