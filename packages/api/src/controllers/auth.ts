/**
 * Special controller for forwarding all incoming requests to a geolocated API region
 */

import { Router } from "express";
import { authMiddleware } from "../middleware";
import { db } from "../store";

const app = Router();

app.use(
  authMiddleware({ originalUriHeader: "x-original-uri" }),
  async (req, res) => {
    const streamId = req.headers["x-livepeer-stream-id"];
    const stream = await db.stream.get(streamId?.toString() ?? "");

    const exists = stream && !stream.deleted;
    if (!exists) {
      return res.status(404).json({ errors: ["not found"] });
    }
    const hasAccess = stream?.userId === req.user.id || req.user.admin;
    if (!hasAccess) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    res.status(204).end();
  }
);

export default app;
