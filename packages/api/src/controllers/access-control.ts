import signingKeyApp from "./signing-key";
import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../store/errors";
import tracking from "../middleware/tracking";

const accessControl = Router();

const app = Router();

accessControl.use("/signing-key", signingKeyApp);
app.use("/access-control", accessControl);

accessControl.post(
  "/gate",
  validatePost("access-control-gate-payload"),
  async (req, res) => {
    const playbackId = req.body.stream.replace(/^\w+\+/, "");
    console.log(`
      access-control: gate: request for playbackId: ${playbackId}
    `);
    const content =
      (await db.stream.getByPlaybackId(playbackId)) ||
      (await db.asset.getByPlaybackId(playbackId));

    if (!content || content.deleted) {
      console.log(`
        access-control: gate: content not found for playbackId ${playbackId}, disallowing playback
      `);
      throw new NotFoundError("Content not found");
    }

    const user = await db.user.get(content.userId);

    if (user.suspended || ("suspended" in content && content.suspended)) {
      console.log(`
        access-control: disallowing access for contentId=${content.id}, user ${user.id} is suspended
      `);
      throw new NotFoundError("Content not found");
    }

    const playbackPolicyType = content.playbackPolicy?.type ?? "public";

    if (playbackPolicyType === "public") {
      res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
      res.status(204);
      return res.end();
    } else if (playbackPolicyType === "jwt") {
      if (!req.body.pub) {
        console.log(`
          access-control: gate: no pub provided for playbackId ${playbackId}, disallowing playback
        `);
        throw new ForbiddenError("Content is gated and requires a public key");
      }

      const query = [];
      query.push(sql`signing_key.data->>'publicKey' = ${req.body.pub}`);
      const [signingKeyOutput] = await db.signingKey.find(query, {
        limit: 2,
      });

      if (signingKeyOutput.length == 0) {
        console.log(`
          access-control: gate: content with playbackId ${playbackId} is gated but corresponding public key not found for key ${req.body.pub}, disallowing playback
        `);
        throw new ForbiddenError(
          "Content is gated and corresponding public key not found"
        );
      }

      if (signingKeyOutput.length > 1) {
        console.log(`
          access-control: gate: content contentId ${content.id} is gated but multiple public keys found for key ${req.body.pub}, disallowing playback
        `);
        throw new BadRequestError(
          "Multiple signing keys found for the same public key."
        );
      }

      const signingKey = signingKeyOutput[0];

      if (signingKey.userId !== content.userId) {
        console.log(`
          access-control: disallowing playback for contentId=${content.id} the content and the public key pub=${signingKey.id} do not share the same owner
        `);
        throw new NotFoundError("Content not found");
      }

      if (signingKey.disabled || signingKey.deleted) {
        console.log(`
          access-control: disallowing playback for contentId=${content.id} the public key pub=${signingKey.id} is disabled or deleted
        `);
        throw new ForbiddenError("The public key is disabled or deleted");
      }

      tracking.recordSigningKeyValidation(signingKey.id);
      res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
      res.status(204);
      return res.end();
    } else {
      console.log(`
        access-control: gate: content with playbackId ${playbackId} is gated but playbackPolicyType ${playbackPolicyType} is not supported, disallowing playback
      `);
      throw new BadRequestError(
        `unknown playbackPolicy type: ${playbackPolicyType}`
      );
    }
  }
);

export default accessControl;
