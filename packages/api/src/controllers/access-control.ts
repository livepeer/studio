import signingKeyApp from "./signing-key";
import { validatePost } from "../middleware";
import { Request, Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  BadGatewayError,
  InternalServerError,
} from "../store/errors";
import tracking from "../middleware/tracking";
import { DBWebhook } from "../store/webhook-table";
import { Asset, PlaybackPolicy, User } from "../schema/types";
import { signatureHeaders, storeTriggerStatus } from "../webhooks/cannon";
import { Response } from "node-fetch";
import { fetchWithTimeoutAndRedirects } from "../util";
import fetch from "node-fetch";
import { WithID } from "../store/types";
import { DBStream } from "../store/stream-table";
import { getViewers } from "./usage";
import { HACKER_DISABLE_CUTOFF_DATE } from "./utils/notification";
import { isFreeTierUser } from "./helpers";

const WEBHOOK_TIMEOUT = 30 * 1000;
const MAX_ALLOWED_VIEWERS_FOR_FREE_TIER = 5;
const app = Router();

interface HitRecord {
  timestamp: number;
}

const playbackHits: Record<string, HitRecord[]> = {};

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
      timestamp: timestamp,
    }),
  };

  const sigHeaders = signatureHeaders(
    params.body,
    webhook.sharedSecret,
    timestamp
  );
  params.headers = { ...params.headers, ...sigHeaders };

  const startTime = process.hrtime();
  let resp: Response;
  let errorMessage: string;
  let statusCode: number;

  try {
    resp = await fetchWithTimeoutAndRedirects(webhook.url, params);
    statusCode = resp.status;

    if (resp.status < 200 || resp.status >= 300) {
      console.error(
        `access-control: gate: webhook=${webhook.id} got response status != 2XX statusCode=${resp.status}`
      );
      errorMessage = `webhook=${webhook.id} got response status != 2XX statusCode=${resp.status}`;
    }
  } catch (e) {
    errorMessage = e.message;
    statusCode = 0;
  } finally {
    await storeTriggerStatus(
      webhook,
      timestamp,
      statusCode,
      errorMessage,
      undefined
    );
    if (resp) {
      // Dispose of the response body
      await resp.text();
    }
  }
  return statusCode;
}

app.use("/signing-key", signingKeyApp);

app.post(
  "/gate",
  validatePost("access-control-gate-payload"),
  async (req, res) => {
    const playbackId = req.body.stream.replace(/^\w+\+/, "");
    const content =
      (await db.stream.getByPlaybackId(playbackId)) ||
      (await db.asset.getByPlaybackId(playbackId));

    res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");

    if (!content || content.deleted) {
      const contentLog = JSON.stringify(JSON.stringify(content));
      console.log(`
        access-control: gate: content not found for playbackId=${playbackId}, disallowing playback, content=${contentLog}
      `);
      throw new NotFoundError("Content not found");
    }

    const user = await db.user.get(content.userId);

    if (user.suspended || ("suspended" in content && content.suspended)) {
      const contentLog = JSON.stringify(JSON.stringify(content));
      console.log(`
        access-control: gate: disallowing access for contentId=${content.id} playbackId=${playbackId}, user=${user.id} is suspended, content=${contentLog}
      `);
      throw new NotFoundError("Content not found");
    }

    const playbackPolicyType = content.playbackPolicy?.type ?? "public";
    const allowedOrigins = content.playbackPolicy?.allowedOrigins ?? [];

    if (user.createdAt < HACKER_DISABLE_CUTOFF_DATE) {
      let limitReached = await freeTierLimitReached(content, user, req);
      if (limitReached) {
        throw new ForbiddenError("Free tier user reached viewership limit");
      }
    }

    if (
      playbackPolicyType !== "public" &&
      req.body.pub === req.config.accessControlAdminPubkey &&
      req.body.pub !== "" &&
      req.body.pub
    ) {
      res.status(204);
      return res.end();
    }

    if (req.body.origin) {
      if (allowedOrigins.length > 0) {
        if (!allowedOrigins.includes(req.body.origin)) {
          throw new ForbiddenError(
            "Content is gated and origin not in allowed origins"
          );
        }
      }
    }

    switch (playbackPolicyType) {
      case "public":
        res.status(204);
        return res.end();
      case "jwt":
        if (!req.body.pub) {
          console.log(`
            access-control: gate: no pub provided for playbackId=${playbackId}, disallowing playback
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
            access-control: gate: content with playbackId=${playbackId} is gated but corresponding public key not found for key=${req.body.pub}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and corresponding public key not found"
          );
        }

        if (signingKeyOutput.length > 1) {
          let collisionKeys = JSON.stringify(signingKeyOutput);
          console.log(`
            access-control: gate: content contentId=${content.id} with playbackId=${playbackId} is gated but multiple (${signingKeyOutput.length}) public keys found for key=${req.body.pub}, disallowing playback, colliding keys=${collisionKeys}
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
        res.status(204);
        return res.end();
      case "webhook":
        if (!req.body.accessKey || req.body.type !== "accessKey") {
          throw new ForbiddenError(
            "Content is gated and requires an access key"
          );
        }

        const webhook = await db.webhook.get(content.playbackPolicy.webhookId);
        if (!webhook) {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but corresponding webhook not found for webhookId=${content.playbackPolicy.webhookId}, disallowing playback
          `);
          throw new InternalServerError(
            "Content is gated and corresponding webhook not found"
          );
        }
        const statusCode = await fireGateWebhook(
          webhook,
          content.playbackPolicy,
          req.body.accessKey
        );
        if (statusCode >= 200 && statusCode < 300) {
          res.status(204);
          return res.end();
        } else if (statusCode === 0) {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but webhook=${webhook.id} failed, disallowing playback
          `);
          throw new BadGatewayError(
            "Content is gated and corresponding webhook failed"
          );
        } else {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but webhook=${webhook.id} returned status code ${statusCode}, disallowing playback
          `);
          throw new BadGatewayError(
            "Content is gated and corresponding webhook failed"
          );
        }
      default:
        throw new BadRequestError(
          `unknown playbackPolicy type: ${playbackPolicyType}`
        );
    }
  }
);

app.get("/public-key", async (req, res) => {
  const { catalystBaseUrl } = req.config;

  let url = `${catalystBaseUrl}/api/pubkey`;
  let options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  await fetch(url, options)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error(
          `access-control: error retrieving public key from catalyst statusCode=${response.status} catalystUrl=${url}`
        );
      }
    })
    .then((responseJson) => {
      res.status(200).json(responseJson);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "Unable to retrieve public key" });
    });
});

async function freeTierLimitReached(
  content: DBStream | WithID<Asset>,
  user: User,
  req: Request
): Promise<boolean> {
  if (!isFreeTierUser(user)) {
    return false;
  }

  // Register a hit for the given playbackId
  const now = Date.now();
  const playbackId = content.playbackId;

  if (!playbackHits[playbackId]) {
    playbackHits[playbackId] = [];
  }

  // Remove hits that are older than three minutes
  playbackHits[playbackId] = playbackHits[playbackId].filter(
    (hit) => now - hit.timestamp < 60 * 3 * 1000
  );

  // Add a new hit record
  playbackHits[playbackId].push({ timestamp: now });

  // Check if the number of hits in the last minute exceeds the threshold
  if (playbackHits[playbackId].length > MAX_ALLOWED_VIEWERS_FOR_FREE_TIER) {
    return true;
  } else {
    return false;
  }
}

export default app;
