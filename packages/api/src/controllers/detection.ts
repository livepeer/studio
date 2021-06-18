import { Router } from "express";
import { v4 as uuid } from "uuid";

import { validatePost } from "../middleware";
import { DetectionWebhookPayload } from "../schema/types";
import { db } from "../store";

const app = Router();

app.post(
  "/hook",
  validatePost("detection-webhook-payload"),
  async (req, res) => {
    const payload = req.body as DetectionWebhookPayload;
    const stream = await db.stream.get(payload.manifestID);
    if (!stream) {
      return res.status(404).json({ errors: ["stream not found"] });
    }

    await req.queue.emit({
      id: uuid(),
      createdAt: Date.now(),
      channel: "webhooks",
      event: "stream.detection",
      streamId: stream.id,
      userId: stream.userId,
      payload: {
        streamId: stream.id,
        seqNo: payload.seqNo,
        sceneClassifications: payload.sceneClassification,
      },
    });
    return res.status(204);
  }
);

export default app;
