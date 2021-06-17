import { Router } from "express";
import sql from "sql-template-strings";

import { validatePost } from "../middleware";
import { DetectionWebhookPayload } from "../schema/types";
import { db } from "../store";

const app = Router();

app.post(
  "/hook",
  validatePost("detection-webhook-payload"),
  async (req, res) => {
    const payload = req.body as DetectionWebhookPayload;

    // TODO: consider a single JOINed query
    const stream = await db.stream.get(payload.manifestID);
    const query = [
      sql`data->>'userId' = ${stream.userId}`,
      sql`data->>'event' = 'stream.detection'`,
      // TODO: check this syntax
      sql`data->>'streamId' = ${stream.id} OR data->>'streamId' IS NULL`,
    ];
    const [webhooks] = await db.webhook.find(query);
    if (webhooks.length === 0) {
      return res.status(204);
    }

    const whPayload = JSON.stringify({
      streamId: stream.id,
      seqNo: payload.seqNo,
      sceneClassifications: payload.sceneClassification,
    });
    // TODO: Send webhooks through actual event queue (webhook cannon?)
    await Promise.all(
      webhooks.map((wh) =>
        fetch(wh.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: whPayload,
        })
      )
    );

    return res.status(204);
  }
);

export default app;
