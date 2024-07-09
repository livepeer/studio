import { Response, Router } from "express";
import LitJsSdk from "@lit-protocol/sdk-nodejs";

import { createHmac } from "crypto";

import { db } from "../../store";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../store/errors";
import { withPlaybackUrls } from "../asset";
import { Asset } from "../../schema/types";
import { WithID } from "../../store/types";
import { CliArgs } from "../../parse-cli";

export function signGoogleCDNCookie(
  config: CliArgs,
  urlPrefix: string,
  expirationMs: number,
): [string, string] {
  const {
    googleCloudUrlSigningKeyName: keyName,
    googleCloudUrlSigningKey: keyb64,
  } = config;
  if (!keyName || !keyb64) {
    throw new InternalServerError("Missing URL signing key config");
  }
  const encodedURLPrefix = Buffer.from(urlPrefix).toString("base64url");
  const expires = Math.round(expirationMs / 1000);
  const input = `URLPrefix=${encodedURLPrefix}:Expires=${expires}:KeyName=${keyName}`;

  const key = Buffer.from(keyb64, "base64url");
  const mac = createHmac("sha1", key);
  mac.update(input);
  const sig = mac.digest("base64url");

  return ["Cloud-CDN-Cookie", `${input}:Signature=${sig}`];
}

function getPlaybackFolderPrefix(playbackUrl: string) {
  const url = new URL(playbackUrl);
  url.pathname = url.pathname.substring(0, url.pathname.lastIndexOf("/"));
  return url;
}

function setGoogleCloudCookie(res: Response, asset: WithID<Asset>) {
  const urlPrefix = getPlaybackFolderPrefix(asset.playbackUrl);
  const ttl = Math.max(
    60 * 60 * 1000,
    2 * Math.round(asset.videoSpec.duration * 1000),
  );
  const expiration = Date.now() + ttl;
  const [name, value] = signGoogleCDNCookie(
    res.req.config,
    urlPrefix.toString(),
    expiration,
  );
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(expiration),
    domain: urlPrefix.hostname,
    path: urlPrefix.pathname,
    encode: (v) => v,
  });
}

const app = Router();

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
  asset = await withPlaybackUrls(req.config, ingest, asset);
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

export default app;
