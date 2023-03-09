import signingKeyApp from "./signing-key";
import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  BadGatewayError,
} from "../store/errors";
import tracking from "../middleware/tracking";
import { DBWebhook } from "../store/webhook-table";
import { PlaybackPolicy } from "../schema/types";
import { addSignatureHeader } from "../webhooks/cannon";
import { Response } from "node-fetch";
import { fetchWithTimeout } from "../util";

const WEBHOOK_TIMEOUT = 5 * 1000;
const app = Router();

app.use("/signing-key", signingKeyApp);

app.post(
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
      const contentLog = JSON.stringify(JSON.stringify(content));

      console.log(`
        access-control: gate: content not found for playbackId ${playbackId}, disallowing playback, content=${contentLog}
      `);
      throw new NotFoundError("Content not found");
    }

    const user = await db.user.get(content.userId);

    if (user.suspended || ("suspended" in content && content.suspended)) {
      const contentLog = JSON.stringify(JSON.stringify(content));
      const userLog = JSON.stringify(JSON.stringify(user));

      console.log(`
        access-control: gate: disallowing access for contentId=${content.id} playbackId=${playbackId}, user ${user.id} is suspended, content=${contentLog}, user=${userLog}
      `);
      throw new NotFoundError("Content not found");
    }

    const playbackPolicyType = content.playbackPolicy?.type ?? "public";

    switch (playbackPolicyType) {
      case "public":
        res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
        res.status(204);
        return res.end();
      case "jwt":
        if (!req.body.pub) {
          console.log(`
            access-control: gate: no pub provided for playbackId ${playbackId}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and requires a public key"
          );
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
          let collisionKeys = JSON.stringify(signingKeyOutput);
          console.log(`
            access-control: gate: content contentId ${content.id} with playbackId=${playbackId} is gated but multiple (${signingKeyOutput.length}) public keys found for key ${req.body.pub}, disallowing playback, colliding keys=${collisionKeys}
          `);
          throw new BadRequestError(
            "Multiple signing keys found for the same public key."
          );
        }

        const signingKey = signingKeyOutput[0];

        if (signingKey.userId !== content.userId) {
          console.log(`
            access-control: gate: disallowing playback for contentId=${content.id} with playbackId=${playbackId} the content and the public key pub=${req.body.pub} do not share the same owner, signingKeyUserId=${signingKey.userId}, contentUserId=${content.userId}
          `);
          throw new NotFoundError("Content not found");
        }

        if (signingKey.disabled || signingKey.deleted) {
          const signingKeyLog = JSON.stringify(JSON.stringify(signingKey));
          console.log(`
            access-control: gate: disallowing playback for contentId=${content.id} with playbackId=${playbackId} the public key pub=${signingKey.id} is disabled or deleted, signingKey=${signingKeyLog}
          `);
          throw new ForbiddenError("The public key is disabled or deleted");
        }

        tracking.recordSigningKeyValidation(signingKey.id);
        res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
        res.status(204);
        return res.end();
      case "webhook":
        if (!req.body.accessKey) {
          console.log(`
            access-control: gate: no accessKey provided for playbackId ${playbackId}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and requires an access key"
          );
        }
        const webhook = await db.webhook.get(content.playbackPolicy.webhookId);
        if (!webhook) {
          console.log(`
            access-control: gate: content with playbackId ${playbackId} is gated but corresponding webhook not found for webhookId ${content.playbackPolicy.webhookId}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and corresponding webhook not found"
          );
        }
        const statusCode = await fireGateWebhook(
          webhook,
          content.playbackPolicy,
          req.body.accessKey
        );
        switch (statusCode) {
          case 200:
            res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");
            res.status(204);
            return res.end();
          case 0:
            console.log(`
              access-control: gate: content with playbackId ${playbackId} is gated but webhook ${webhook.id} failed, disallowing playback
            `);
            throw new BadGatewayError(
              "Content is gated and corresponding webhook failed"
            );
          default:
            console.log(`
              access-control: gate: content with playbackId ${playbackId} is gated but webhook ${webhook.id} returned status code ${statusCode}, disallowing playback
            `);
            if (statusCode >= 400 && statusCode < 500) {
              res.status(statusCode);
              return res.end();
            }
            throw new BadGatewayError(
              "Content is gated and corresponding webhook failed"
            );
        }
      default:
        console.log(`
          access-control: gate: content with playbackId ${playbackId} is gated but playbackPolicyType ${playbackPolicyType} is not supported, disallowing playback
        `);
        throw new BadRequestError(
          `unknown playbackPolicy type: ${playbackPolicyType}`
        );
    }
  }
);

async function fireGateWebhook(
  webhook: DBWebhook,
  plabackPolicy: PlaybackPolicy,
  accessKey: string
) {
  let timestamp = Date.now();
  let params = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "livepeer.studio",
    },
    timeout: WEBHOOK_TIMEOUT,
    body: JSON.stringify({
      context: plabackPolicy.webhookContext,
      accessKey: accessKey,
    }),
  };

  if (webhook.sharedSecret) {
    params = await addSignatureHeader(params, webhook, timestamp);
  }

  const startTime = process.hrtime();
  let resp: Response;
  let errorMessage: string;
  let responseBody: string;
  let statusCode: number;

  try {
    console.log(`webhook ${webhook.id} firing`);
    resp = await fetchWithTimeout(webhook.url, params);
    responseBody = await resp.text();
    statusCode = resp.status;

    if (resp.status >= 200 && resp.status < 300) {
      // 2xx requests are cool. all is good
      console.log(`webhook ${webhook.id} fired successfully`);
    }

    console.error(
      `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
    );
  } catch (e) {
    console.log(`
      webhook ${webhook.id} failed to fire: ${e.message}
    `);
    errorMessage = e.message;
    statusCode = 0;
  } finally {
    await this.storeTriggerStatus(
      webhook,
      timestamp,
      statusCode,
      errorMessage,
      responseBody
    );
    return statusCode;
  }
}

export default app;
