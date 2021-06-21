import { Router } from "express";
import { v4 as uuid } from "uuid";

import { validatePost } from "../middleware";
import { DetectionWebhookPayload, Queue } from "../schema/types";
import { db } from "../store";

export const streamDetectionEvent = "stream.detection";

const app = Router();

// TODO: create some tests for this
app.post(
  "/hook",
  validatePost("detection-webhook-payload"),
  async (req, res) => {
    const payload = req.body as DetectionWebhookPayload;
    const stream = await db.stream.getByPlaybackId(payload.manifestID);
    if (!stream) {
      return res.status(404).json({ errors: ["stream not found"] });
    }
    console.log(`DetectionWebhookPayload: ${JSON.stringify(payload)}`);

    await req.queue.emit({
      id: uuid(),
      createdAt: Date.now(),
      channel: "webhooks",
      event: streamDetectionEvent,
      streamId: stream.id,
      userId: stream.userId,
      payload: {
        streamId: stream.id,
        seqNo: payload.seqNo,
        sceneClassifications: payload.sceneClassification,
      },
    } as Queue);
    return res.status(204);
  }
);

export default app;
