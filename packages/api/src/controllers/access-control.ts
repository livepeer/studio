import signingKeyApp from "./signing-key";
import { validatePost } from "../middleware";
import { Request, Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import { products } from "../config";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  BadGatewayError,
  InternalServerError,
} from "../store/errors";
import tracking from "../middleware/tracking";
import { DBWebhook } from "../store/webhook-table";
import {
  AccessControlGatePayload,
  Asset,
  PlaybackPolicy,
  User,
} from "../schema/types";
import { signatureHeaders, storeTriggerStatus } from "../webhooks/cannon";
import { Response } from "node-fetch";
import { fetchWithTimeoutAndRedirects } from "../util";
import fetch from "node-fetch";
import { HACKER_DISABLE_CUTOFF_DATE } from "./utils/notification";
import { isFreeTierUser } from "./helpers";
import { cache } from "../store/cache";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";

const WEBHOOK_TIMEOUT = 30 * 1000;
const app = Router();

type GateConfig = {
  refresh_interval: number;
  user_viewer_limit: number;
  user_id: string;
};

async function fireGateWebhook(
  webhook: DBWebhook,
  content: DBStream | WithID<Asset>,
  payload: AccessControlGatePayload,
) {
  let timestamp = Date.now();
  let jsonPayload = {
    context: content.playbackPolicy.webhookContext,
    accessKey: payload.accessKey,
    timestamp: timestamp,
  };

  if (payload.webhookPayload) {
    if (payload.webhookPayload.headers) {
      payload.webhookPayload.headers["Tx-Stream-Id"] = content.name;
    }
    jsonPayload = { ...jsonPayload, ...payload.webhookPayload };
  }

  let params = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "livepeer.studio",
    },
    timeout: WEBHOOK_TIMEOUT,
    body: JSON.stringify(jsonPayload),
  };

  if ("pull" in content && content.pull) {
    params.headers["Trovo-Auth-Version"] = "1.1";
  }

  const sigHeaders = signatureHeaders(
    params.body,
    webhook.sharedSecret,
    timestamp,
  );
  params.headers = { ...params.headers, ...sigHeaders };

  const startTime = process.hrtime();
  let resp: Response;
  let respBody = "";
  let errorMessage: string;
  let statusCode: number;
  let bodyStatusCode: number;

  try {
    resp = await fetchWithTimeoutAndRedirects(webhook.url, params);
    statusCode = resp.status;

    // Dispose of the response body
    respBody = await resp.text();
    if (resp.status >= 200 && resp.status < 300) {
      // try parsing response body to check for access denied with a 200
      bodyStatusCode = checkRespBody(respBody);
      if (bodyStatusCode) {
        statusCode = bodyStatusCode;
      }
    }

    if (statusCode < 200 || statusCode >= 300) {
      errorMessage = `webhook=${webhook.id} got response status != 2XX statusCode=${resp.status} bodyStatusCode=${bodyStatusCode}`;
      console.error(`access-control: gate: ${errorMessage}`);
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
      undefined,
    );
  }
  if ("pull" in content && content.pull) {
    try {
      let referer: string, origin: string;
      if (payload?.webhookPayload?.headers) {
        referer = payload?.webhookPayload?.headers["Referer"];
        origin = payload?.webhookPayload?.headers["Origin"];
      }
      let playURL = payload?.webhookPayload?.playURL;
      let playDomain = payload?.webhookPayload?.playDomain;
      console.log(
        `access-control: gate: webhook=${
          webhook.id
        } statusCode=${statusCode} respSpanId=${resp?.headers.get(
          "X-Tlive-Spanid",
        )} respBody=${Buffer.from(respBody).toString("base64")} duration=${
          process.hrtime(startTime)[1] / 1e6
        }ms accessKey=${payload.accessKey} playbackId=${
          content.playbackId
        } webhook=${
          webhook.id
        } referer=${referer} origin=${origin} playURL=${playURL} playDomain=${playDomain}`,
      );
    } catch (e) {
      console.log(
        `access-control: gate: webhook=${
          webhook.id
        } statusCode=${statusCode} respSpanId=${resp?.headers.get(
          "X-Tlive-Spanid",
        )} respBody=${Buffer.from(respBody).toString("base64")} duration=${
          process.hrtime(startTime)[1] / 1e6
        }ms accessKey=${payload.accessKey} playbackId=${
          content.playbackId
        } webhook=${webhook.id}`,
      );
    }
  } else {
    console.log(
      `access-control: gate: webhook=${
        webhook.id
      } statusCode=${statusCode} duration=${
        process.hrtime(startTime)[1] / 1e6
      }ms`,
    );
  }
  return statusCode;
}

function checkRespBody(resp: string): number | null {
  if (!resp || resp == "") {
    return;
  }
  try {
    const body = JSON.parse(resp);
    return body.ret;
  } catch (e) {
    console.log(
      `access-control: error checking response body for status code: ${e}`,
    );
  }
}

app.use("/signing-key", signingKeyApp);

app.post(
  "/gate",
  validatePost("access-control-gate-payload"),
  async (req, res) => {
    const playbackId = req.body.stream.replace(/^\w+\+/, "");

    let content = await cache.getOrSet(
      `acl-content-${playbackId}`,
      async () => {
        return (
          (await db.stream.getByPlaybackId(playbackId)) ||
          (await db.asset.getByPlaybackId(playbackId))
        );
      },
    );

    res.set("Cache-Control", "max-age=120,stale-while-revalidate=600");

    if (!content || content.deleted) {
      const contentLog = JSON.stringify(JSON.stringify(content));
      console.log(`
        access-control: gate: content not found for playbackId=${playbackId}, disallowing playback, content=${contentLog}
      `);
      throw new NotFoundError("Content not found");
    }

    let user = await db.user.get(content.userId, { useCache: true });

    if (
      user.suspended ||
      ("suspended" in content && content.suspended) ||
      user.disabled
    ) {
      const contentLog = JSON.stringify(JSON.stringify(content));
      console.log(`
        access-control: gate: disallowing access for contentId=${content.id} playbackId=${playbackId}, user=${user.id} is suspended or disabled, content=${contentLog}
      `);
      throw new NotFoundError("Content not found");
    }

    const playbackPolicyType = content.playbackPolicy?.type ?? "public";
    const allowedOrigins = content.playbackPolicy?.allowedOrigins ?? [];

    let config: Partial<GateConfig> = {};

    let viewerLimit = req.config.accessControlDefaultMaxConcurrentViewers;

    if (user.stripeProductId) {
      let userProduct = products[user.stripeProductId];
      if (userProduct?.viewerLimit) {
        viewerLimit = userProduct.viewerLimit;
      }
    }

    if (user.viewerLimit || user.viewerLimit === 0) {
      viewerLimit = user.viewerLimit;
    }

    config.user_viewer_limit = viewerLimit;
    config.user_id = user.id;

    if (content.playbackPolicy?.refreshInterval) {
      config.refresh_interval = content.playbackPolicy.refreshInterval;
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

    let origin = req.body?.webhookPayload?.headers?.Origin;
    const referer = req.body?.webhookPayload?.headers?.Referer;

    if (origin || origin === "") {
      if (origin === "null" || origin === "") {
        origin = referer;
        console.log(
          `access-control: gate: origin is null, using referer=${origin} for playbackId=${playbackId}`,
        );
      }

      origin = decodeURIComponent(origin); // Decode the origin or referer
      origin = origin.replace(/\/$/, ""); // Strip trailing slashes

      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes("*")) {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated, wildcard origin allowed
          `);
        } else {
          if (!allowedOrigins.includes(origin)) {
            console.log(`
              access-control: gate: content with playbackId=${playbackId} is gated but origin=${origin} not in allowed origins=${allowedOrigins}, disallowing playback
            `);
            throw new ForbiddenError(
              `Content is gated and origin not in allowed origins`,
            );
          }
        }
      }
    }

    switch (playbackPolicyType) {
      case "public":
        res.status(200);
        return res.json(config);
      case "jwt":
        if (!req.body.pub) {
          console.log(`
            access-control: gate: no pub provided for playbackId=${playbackId}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and requires a public key",
          );
        }

        const [signingKeyOutput] = await cache.getOrSet(
          `acl-signing-key-pub-${req.body.pub}`,
          () => {
            const query = [
              sql`signing_key.data->>'publicKey' = ${req.body.pub}`,
            ];
            return db.signingKey.find(query, { limit: 2 });
          },
        );

        if (signingKeyOutput.length == 0) {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but corresponding public key not found for key=${req.body.pub}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and corresponding public key not found",
          );
        }

        if (signingKeyOutput.length > 1) {
          let collisionKeys = JSON.stringify(signingKeyOutput);
          console.log(`
            access-control: gate: content contentId=${content.id} with playbackId=${playbackId} is gated but multiple (${signingKeyOutput.length}) public keys found for key=${req.body.pub}, disallowing playback, colliding keys=${collisionKeys}
          `);
          throw new BadRequestError(
            "Multiple signing keys found for the same public key.",
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
        res.status(200);
        return res.json(config);
      case "webhook":
        if (!req.body.accessKey || req.body.type !== "accessKey") {
          throw new ForbiddenError(
            "Content is gated and requires an access key",
          );
        }
        const webhook = await db.webhook.get(content.playbackPolicy.webhookId, {
          useCache: true,
        });
        if (!webhook) {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but corresponding webhook not found for webhookId=${content.playbackPolicy.webhookId}, disallowing playback
          `);
          throw new InternalServerError(
            "Content is gated and corresponding webhook not found",
          );
        }

        const gatePayload: AccessControlGatePayload = req.body;

        const statusCode = await fireGateWebhook(webhook, content, gatePayload);

        if (statusCode >= 200 && statusCode < 300) {
          res.status(200);
          return res.json(config);
        } else if (statusCode === 0) {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but webhook=${webhook.id} failed, disallowing playback
          `);
          throw new BadGatewayError(
            "Content is gated and corresponding webhook failed",
          );
        } else {
          console.log(`
            access-control: gate: content with playbackId=${playbackId} is gated but webhook=${webhook.id} returned status code ${statusCode}, disallowing playback
          `);
          throw new ForbiddenError(
            "Content is gated and corresponding webhook failed",
          );
        }
      default:
        throw new BadRequestError(
          `unknown playbackPolicy type: ${playbackPolicyType}`,
        );
    }
  },
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
          `access-control: error retrieving public key from catalyst statusCode=${response.status} catalystUrl=${url}`,
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

export default app;
