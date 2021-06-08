import Router from "express/lib/router";
import bodyParser from "body-parser"

const app = Router();
app.use(bodyParser.json())

app.post("/hook", detectionWebhookHandler)

async function detectionWebhookHandler(req, res) {
    console.log(JSON.stringify(req.body, null, 2))
    return res.status(200).json({})
}

export default app;