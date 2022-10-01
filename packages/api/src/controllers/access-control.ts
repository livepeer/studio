import signingKeyApp from "./signing-key";
import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import { ForbiddenError, NotFoundError } from "../store/errors";

const accessControl = Router();

const app = Router();

accessControl.use("/signing-key", signingKeyApp);
app.use("/access-control", accessControl);

accessControl.post(
  "/gate",
  authorizer({ anyAdmin: true }),
  validatePost("access-control-gate-payload"),
  async (req, res) => {
    const playbackId = req.body.stream.replace("video+", "");
    const content =
      (await db.stream.getByPlaybackId(playbackId)) ||
      (await db.asset.getByPlaybackId(playbackId));

    if (!content || content.deleted) {
      throw new NotFoundError("Content not found");
    }

    const playbackPolicy = content.playbackPolicy;

    if (playbackPolicy) {
      if (playbackPolicy.type === "public") {
        res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
        res.status(204);
        return res.end();
      }

      if (playbackPolicy.type === "signed") {
        if (!req.body.pub) {
          throw new ForbiddenError("Stream is gated and requires a public key");
        }

        const query = [];
        query.push(sql`signing_key.data->>'publicKey' = ${req.body.pub}`);
        const [signingKeyOutput] = await db.signingKey.find(query, {
          limit: 1,
        });

        if (signingKeyOutput.length == 0) {
          throw new ForbiddenError(
            "Stream is gated and corresponding public key not found"
          );
        }

        const signingKey = signingKeyOutput[0];
        if (signingKey.userId !== content.userId) {
          throw new ForbiddenError(
            "The stream and the public key do not share the same owner"
          );
        }

        if (signingKey.disabled || signingKey.deleted) {
          throw new ForbiddenError("The public key is disabled or deleted");
        }
      }
    }
    res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
    res.status(204);
    return res.end();
  }
);

export default accessControl;
