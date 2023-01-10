import signingKeyApp from "./signing-key";
import { validatePost } from "../middleware";
import { Request, Response, Router } from "express";
import _ from "lodash";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../store/errors";
import tracking from "../middleware/tracking";
import LitJsSdk from "@lit-protocol/sdk-nodejs";
import { signGoogleCDNCookie } from "./helpers";
import { withPlaybackUrls } from "./asset";
import { WithID } from "../store/types";
import { Asset } from "../schema/types";

function getPlaybackFolderPrefix(playbackUrl: string) {
  const url = new URL(playbackUrl);
  url.pathname = url.pathname.substring(0, url.pathname.lastIndexOf("/"));
  return url;
}

function setGoogleCloudCookie(res: Response, asset: WithID<Asset>) {
  const urlPrefix = getPlaybackFolderPrefix(asset.playbackUrl);
  const ttl = Math.max(
    60 * 60 * 1000,
    2 * Math.round(asset.videoSpec.duration * 1000)
  );
  const expiration = Date.now() + ttl;
  const [name, value] = signGoogleCDNCookie(
    res.req.config,
    urlPrefix.toString(),
    expiration
  );
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(expiration),
    domain: urlPrefix.hostname,
    encode: (v) => v,
  });
}

const app = Router();

app.use("/signing-key", signingKeyApp);

app.post("/verify-lit-jwt", async (req, res) => {
  // TODO: Create schema for this request payload
  const { jwt, playbackId } = req.body as Record<string, string>;

  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }
  const ingest = ingests[0].base;

  let asset = await db.asset.getByPlaybackId(playbackId);
  if (!asset) {
    throw new NotFoundError("asset not found");
  }
  asset = await withPlaybackUrls(req, ingest, asset);
  if (!asset?.playbackUrl) {
    throw new BadRequestError("asset is not playable");
  }

  const { verified, header, payload } = LitJsSdk.verifyJwt({
    jwt,
  });

  if (verified) {
    res.status(200);
    if (asset.playbackPolicy?.type == "lit_signing_condition") {
      let resourceId = asset.playbackPolicy.resourceId;
      if (resourceId.baseUrl != payload.baseUrl) {
        throw new ForbiddenError("baseUrl does not match");
      }
      if (resourceId.path != payload.path) {
        throw new ForbiddenError("path does not match");
      }
      if (resourceId.orgId != payload.orgId) {
        throw new ForbiddenError("orgId does not match");
      }
    }
    setGoogleCloudCookie(res, asset);
  } else {
    res.status(403);
  }

  return res.json({
    verified,
    header,
    payload,
  });
});

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

export default app;
