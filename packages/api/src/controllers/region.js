import Router from 'express/lib/router'
import { authMiddleware, validatePost } from '../middleware'
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
  if (!region) {
    return res.status(404)
  }

  return res.json(region)
})

app.put(
  '/:region',
  authMiddleware({ admin: true }),
  validatePost('region'),
  async (req, res, next) => {
    let region = {
      region: req.body.region,
      orchestrators: req.body.orchestrators || [],
    }

    const currentRegion = await db.region.get(req.params.region)
    if (currentRegion) {
      const updateResp = await db.region.update(req.params.region, region)
    } else {
      const resp = await db.region.create({
        id: region.region,
        kind: 'region',
        region: region.region,
        orchestrators: region.orchestrators,
      })
    }

    return res.json(region)
  },
)

app.delete(
  '/:region',
  authMiddleware({ admin: true }),
  async (req, res, next) => {
    const resp = await db.region.delete(`region/${req.params.region}`)
    return res.status(204)
  },
)

export default app
