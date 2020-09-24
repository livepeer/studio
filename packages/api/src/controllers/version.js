import Router from 'express/lib/router'

const app = Router()

app.get('/',  async (req, res) => {
  res.status(200)
  res.json({ tag: `${GIT_TAG}`, commit: `${GIT_COMMIT}`})
})

export default app
