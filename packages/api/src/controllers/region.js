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

app.get('/orchestrator', getOrchestrators)

export default app
