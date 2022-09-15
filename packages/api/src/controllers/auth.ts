/**
 * Special controller for forwarding all incoming requests to a geolocated API region
 */

import { Router } from "express";
import { authorizer } from "../middleware";
import { db } from "../store";

const app = Router();

app.all(
  "/",
  authorizer({ originalUriHeader: "x-original-uri" }),
  async (req, res) => {
    const streamId = req.headers["x-livepeer-stream-id"]?.toString();
    if (streamId) {
      const stream = await db.stream.get(streamId);
      if (!stream || stream.deleted) {
        return res.status(404).json({ errors: ["stream not found"] });
      }
      const hasAccess = stream.userId === req.user.id || req.user.admin;
      if (!hasAccess) {
        return res.status(403).json({ errors: ["access forbidden"] });
      }
    }
    const assetId = req.headers["x-livepeer-asset-id"]?.toString();
    if (assetId) {
      const asset = await db.asset.get(assetId);
      if (!asset || asset.deleted) {
        return res.status(404).json({ errors: ["asset not found"] });
      }
      const hasAccess = asset.userId === req.user.id || req.user.admin;
      if (!hasAccess) {
        return res.status(403).json({ errors: ["access forbidden"] });
      }
    }
    res.status(204).end();
  }
);

export default app;
