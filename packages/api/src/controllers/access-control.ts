import signingKeyApp from "./signing-key";
import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import { ForbiddenError } from "../store/errors";

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

    var query = [];
    query.push(sql`stream.data->>'playbackId' = ${playbackId}`);
    var [output] = await db.stream.find(query, {
      limit: 1,
    });

    if (output.length === 0) {
      // TODO: VOD Assets
      throw new ForbiddenError("Stream not found");
    }
    const stream = output[0];

    if (stream.deleted) {
      throw new ForbiddenError("Stream is deleted");
    }

    const playbackPolicy = stream.playbackPolicy;

    if (playbackPolicy) {
      if (playbackPolicy.type === "public") {
        res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
        res.status(200);
        return res.json();
      }

      if (playbackPolicy.type === "signed") {
        if (!req.body.pub) {
          throw new ForbiddenError("Stream is gated and requires a public key");
        }

        var query = [];
        query.push(sql`signing_key.data->>'publicKey' = ${req.body.pub}`);
        var [signingKeyOutput] = await db.signingKey.find(query, {
          limit: 1,
        });

        if (signingKeyOutput.length == 0) {
          throw new ForbiddenError(
            "Stream is gated and corresponding public key not found"
          );
        }

        const signingKey = signingKeyOutput[0];
        if (signingKey.userId !== stream.userId) {
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
    res.status(200);
    return res.json();
  }
);

export default accessControl;
