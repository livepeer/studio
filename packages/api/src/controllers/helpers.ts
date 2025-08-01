import { Crypto } from "@peculiar/webcrypto";
import { TextEncoder } from "util";
import { URL } from "url";
import fetch from "node-fetch";
import SendgridMail from "@sendgrid/mail";
import SendgridClient from "@sendgrid/client";
import express, { Request, Response } from "express";
import sql, { SQLStatement } from "sql-template-strings";
import { createHmac } from "crypto";
import { S3Client, PutObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import base64url from "base64url";
import { CreatorId, InputCreatorId, ObjectStore, User } from "../schema/types";
import { BadRequestError } from "../store/errors";
import * as nativeCrypto from "crypto";
import { DBStream } from "../store/stream-table";
import { fetchWithTimeoutAndRedirects, sleep } from "../util";
import logger from "../logger";
import { db } from "../store";
import { v4 as uuid } from "uuid";

const ITERATIONS = 10000;
const PAYMENT_FAILED_TIMEFRAME = 3 * 24 * 60 * 60 * 1000;
const PULL_START_TIMEOUT = 60 * 1000;

const crypto = new Crypto();

export function sign(data: string, secret: string) {
  const hmac = createHmac("sha256", secret);
  hmac.update(Buffer.from(data));
  return hmac.digest("hex");
}

export async function hash(password: string, salt: string) {
  let saltBuffer;
  if (salt) {
    saltBuffer = fromHexString(salt);
  } else {
    saltBuffer = crypto.getRandomValues(new Uint8Array(8));
  }

  var encoder = new TextEncoder();
  var passphraseKey = encoder.encode(password);

  // You should firstly import your passphrase Uint8array into a CryptoKey
  const key = await crypto.subtle.importKey(
    "raw",
    passphraseKey,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
  const webKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      // don't get too ambitious, or at least remember
      // that low-power phones will access your app
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,

    // Note: for this demo we don't actually need a cipher suite,
    // but the api requires that it must be specified.
    // For AES the length required to be 128 or 256 bits (not bytes)
    { name: "AES-CBC", length: 256 },

    // Whether or not the key is extractable (less secure) or not (more secure)
    // when false, the key can only be passed as a web crypto object, not inspected
    true,

    // this web crypto object will only be allowed for these functions
    ["encrypt", "decrypt"],
  );
  const buffer = await crypto.subtle.exportKey("raw", webKey);

  const outKey = bytesToHexString(new Uint8Array(buffer));
  const outSalt = bytesToHexString(saltBuffer);
  return [outKey, outSalt];
}

const fromHexString = (hexString: string) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export function toStringValues(obj: Record<string, any>) {
  const strObj: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    strObj[key] = value.toString();
  }
  return strObj;
}

export function sqlQueryGroup(values: string[]) {
  const query = sql`(`;
  values.forEach((value, i) => {
    if (i) query.append(`, `);
    query.append(sql`${value}`);
  });
  query.append(`)`);
  return query;
}

export function reqUseReplica(req: Request) {
  if (!req.user.admin) {
    return true;
  }
  // intentional single equal comparison to coalesce arrays
  return req.query.strongConsistency != "1";
}

function bytesToHexString(bytes: Uint8Array, separate = false) {
  /// <signature>
  ///     <summary>Converts an Array of bytes values (0-255) to a Hex string</summary>
  ///     <param name="bytes" type="Array"/>
  ///     <param name="separate" type="Boolean" optional="true">Inserts a separator for display purposes (default = false)</param>
  ///     <returns type="String" />
  /// </signature>

  var result = "";
  for (var i = 0; i < bytes.length; i++) {
    if (separate && i % 4 === 0 && i !== 0) {
      result += "-";
    }

    var hexval = bytes[i].toString(16).toUpperCase();
    // Add a leading zero if needed.
    if (hexval.length === 1) {
      result += "0";
    }

    result += hexval;
  }

  return result;
}

export function makeNextHREF(req: express.Request, nextCursor: string) {
  let baseUrl = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`,
  );
  let next = baseUrl;
  next.searchParams.set("cursor", nextCursor);
  return next.href;
}

export interface ObjectStoreStorage {
  endpoint?: string;
  bucket?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface Web3StoreStorage {
  credentials: {
    proof: string;
  };
}

export function toWeb3StorageUrl(storage: Web3StoreStorage): string {
  if (!storage.credentials || !storage.credentials.proof) {
    throw new Error("undefined property 'credentials.proof'");
  }
  return `w3s://${base64url.fromBase64(storage.credentials.proof)}@/`;
}

export function toObjectStoreUrl(storage: ObjectStoreStorage): string {
  if (!storage.endpoint) {
    throw new Error("undefined property 'endpoint'");
  }
  if (!storage.bucket) {
    throw new Error("undefined property 'bucket'");
  }
  if (
    !storage.credentials ||
    !storage.credentials.accessKeyId ||
    !storage.credentials.secretAccessKey
  ) {
    throw new Error("undefined property 'credentials'");
  }
  const endpointUrl = new URL(storage.endpoint);
  const accessKey = encodeURIComponent(storage.credentials.accessKeyId);
  const secretKey = encodeURIComponent(storage.credentials.secretAccessKey);
  return `s3+${endpointUrl.protocol}//${accessKey}:${secretKey}@${endpointUrl.host}/${storage.bucket}`;
}

export function deleteCredentials(objectStoreUrl: string): string {
  const match = [
    ...objectStoreUrl.matchAll(/^s3\+https?:\/\/(.*):(.*)@.*\/.*$/g),
  ];
  if (match.length == 0) {
    return objectStoreUrl;
  }
  if (match[0].length < 3) {
    return objectStoreUrl;
  }
  const [_, accessKeyId, secretAccessKey] = match[0];
  if (!accessKeyId || !secretAccessKey) {
    return objectStoreUrl;
  }
  return objectStoreUrl
    .replace(accessKeyId, "***")
    .replace(secretAccessKey, "***");
}

export type OSS3Config = S3ClientConfig & {
  bucket: string;
};

export async function getObjectStoreS3Config(
  os: ObjectStore,
): Promise<OSS3Config> {
  const url = new URL(os.url);
  let protocol = url.protocol;
  if (protocol !== "s3+http:" && protocol !== "s3+https:") {
    throw new Error(`Unsupported OS URL protocol: ${protocol}`);
  }
  protocol = protocol.substring(3);

  let segs = url.pathname.split("/").filter((s, i) => i > 0 && !!s);
  if (segs.length === 1) {
    segs = ["ignored", ...segs];
  } else if (segs.length !== 2) {
    throw new Error(`Invalid OS URL path: "${url.pathname}"`);
  }
  const [region, bucket] = segs;
  const credentials = {
    accessKeyId: decodeURIComponent(url.username),
    secretAccessKey: decodeURIComponent(url.password),
  };
  return {
    credentials,
    region,
    bucket,
    signingRegion: region,
    endpoint: `${protocol}//${url.host}`,
    forcePathStyle: true,
  };
}

export async function getS3PresignedUrl(os: ObjectStore, objectKey: string) {
  const config = await getObjectStoreS3Config(os);
  const s3 = new S3Client(config);
  const putCommand = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
  });
  const expiresIn = 12 * 60 * 60; // 12h in seconds
  return getSignedUrl(s3, putCommand, { expiresIn });
}

export async function generateRequesterId(req: Request, playbackId: string) {
  const ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["true-client-ip"] ||
    req.headers["x-forwarded-for"];

  let requesterId: string;
  if (!ip) {
    console.log(`
        unable to determine ip of requester for user=${req.user.id} when clipping playbackId=${playbackId}
    `);
    requesterId = `UNKNOWN-${playbackId}`;
  } else {
    let originString = Array.isArray(ip) ? ip.join(",") : ip;
    originString = originString + req.config.saltForRequesterId + playbackId;

    // hash the origin to anonymize it
    requesterId = nativeCrypto
      .createHash("sha256")
      .update(originString)
      .digest("hex");
  }

  return requesterId;
}

type EmailParams = {
  email: string;
  bcc?: string;
  supportAddr: [string, string];
  sendgridTemplateId: string;
  sendgridApiKey: string;
  subject: string;
  preheader: string;
  text: string;
  buttonText: string;
  buttonUrl: string;
  unsubscribe: string;
};

export async function sendgridEmail({
  email,
  bcc,
  supportAddr,
  sendgridTemplateId,
  sendgridApiKey,
  subject,
  preheader,
  text,
  buttonText,
  buttonUrl,
  unsubscribe,
}: EmailParams) {
  const [supportName, supportEmail] = supportAddr;
  const msg = {
    personalizations: [
      {
        to: [{ email }],
        bcc: bcc ? [{ email: bcc }] : undefined,
        dynamicTemplateData: {
          subject,
          preheader,
          text,
          buttonText,
          buttonUrl,
          unsubscribe,
        },
      },
    ],
    from: {
      email: supportEmail,
      name: supportName,
    },
    reply_to: {
      email: supportEmail,
      name: supportName,
    },
    // email template id: https://mc.sendgrid.com/dynamic-templates
    templateId: sendgridTemplateId,
  };

  SendgridMail.setApiKey(sendgridApiKey);
  await SendgridMail.send(msg);
}

export async function sendgridEmailPaymentFailed({
  email,
  supportAddr,
  sendgridApiKey,
  user,
  invoiceId,
  invoiceUrl,
  templateId,
}) {
  // If user.lastEmailAboutPaymentFailure is newer than 3 days, don't send email
  if (
    user.lastEmailAboutPaymentFailure &&
    user.lastEmailAboutPaymentFailure > Date.now() - PAYMENT_FAILED_TIMEFRAME
  ) {
    console.log(`
      not sending payment failed email to=${email} because last email was sent less than 3 days ago for user=${user.id}
    `);
    return false;
  }

  const [supportName, supportEmail] = supportAddr;

  let subject: string;
  let text: string;

  if (!invoiceId) {
    subject = `Free tier user reached usage limit`;
    text = `User ${user.email} reached usage limit`;
  } else {
    subject = `Payment failed for invoice ${invoiceId} for user ${email}`;
    text = `User ${user.email} failed to pay invoice ${invoiceId}`;
  }

  const msg = {
    personalizations: [
      {
        to: [{ email }],
        bcc: undefined,
        dynamicTemplateData: {
          subject,
          preheader: `Stripe payment failed`,
          text,
          buttonText: `View invoice`,
          buttonUrl: invoiceUrl,
          unsubscribe: invoiceUrl,
        },
      },
    ],
    from: {
      email: supportEmail,
      name: supportName,
    },
    reply_to: {
      email: supportEmail,
      name: supportName,
    },
    // email template id: https://mc.sendgrid.com/dynamic-templates
    templateId: templateId,
  };

  console.log(`
    sending payment failed email to=${email} for user=${
      user.id
    } message=${JSON.stringify(msg)}
  `);

  SendgridMail.setApiKey(sendgridApiKey);
  await SendgridMail.send(msg);

  return true;
}

export function sendgridValidateEmail(email: string, validationApiKey: string) {
  if (!validationApiKey) {
    return;
  }
  sendgridValidateEmailAsync(email, validationApiKey).catch((error) => {
    console.error(
      `Email address validation error email="${email}" error=`,
      error,
    );
  });
}

export async function sendgridValidateEmailAsync(
  email: string,
  validationApiKey: string,
) {
  SendgridClient.setApiKey(validationApiKey);
  const [response, body] = await SendgridClient.request({
    url: `/v3/validations/email`,
    method: "POST",
    body: { email, source: "signup" },
  });

  const { statusCode } = response;
  const verdict = body?.result?.verdict;
  // stringify twice to escape string for logging
  const rawBody = JSON.stringify(JSON.stringify(body));
  console.log(
    `Email address validation result ` +
      `email="${email}" status=${statusCode} verdict=${verdict} body=${rawBody}`,
  );
  return verdict;
}

export type FieldsMap = {
  [key: string]:
    | string
    | {
        type: "boolean" | "int" | "real" | "full-text";
        val: string;
      };
};

export function parseOrder(fieldsMap: FieldsMap, val: string) {
  if (!val) {
    return;
  }
  if (!fieldsMap || Object.keys(fieldsMap).length === 0) {
    return;
  }
  const prep = val
    .split(",")
    .map((v) => {
      const vp = v.split("-");
      if (vp.length !== 2 || !fieldsMap[vp[0]]) {
        return;
      }
      const fv = fieldsMap[vp[0]];
      const dir = vp[1] === "true" ? "DESC" : "ASC";
      if (typeof fv === "string") {
        return `${fv} ${dir} NULLS LAST`;
      }
      if (fv.val) {
        if (fv.type == "boolean") {
          return `coalesce((${fv.val})::boolean, FALSE) ${dir} `;
        } else if (fv.type == "int") {
          return `coalesce((${fv.val})::bigint, 0) ${dir} `;
        } else if (fv.type == "real") {
          return `coalesce((${fv.val})::real, 0.0) ${dir} `;
        } else {
          return `${fv.val} ${dir} NULLS LAST`;
        }
      }
    })
    .filter((v) => !!v);
  return prep.length ? prep.join(", ") : undefined;
}

export function parseFilters(
  fieldsMap: FieldsMap,
  val: string,
): SQLStatement[] {
  try {
    return parseFiltersRaw(fieldsMap, val);
  } catch (e) {
    throw new BadRequestError(`error parsing filters: ${e}`);
  }
}

function parseFiltersRaw(fieldsMap: FieldsMap, val: string): SQLStatement[] {
  const isObject = function (a) {
    return !!a && a.constructor === Object;
  };

  const q: SQLStatement[] = [];
  if (!val) {
    return q;
  }
  if (!fieldsMap || Object.keys(fieldsMap).length === 0) {
    return q;
  }

  const json = JSON.parse(decodeURIComponent(val));
  if (!Array.isArray(json)) {
    throw new Error(`must be an array`);
  }

  for (const filter of json) {
    const fv = fieldsMap[filter.id];
    if (!("value" in filter)) {
      throw new Error(`missing filter value for id "${filter.id}"`);
    }

    if (fv) {
      if (typeof fv === "string") {
        q.push(sql``.append(fv).append(sql` = ${filter.value}`));
      } else if (fv.val) {
        if (fv.type === "boolean") {
          if (typeof filter.value !== "boolean") {
            throw new Error(
              `expected boolean value for field "${
                filter.id
              }", got: ${JSON.stringify(filter.value)}`,
            );
          }
          q.push(
            sql``.append(
              `coalesce((${fv.val})::boolean, FALSE) IS ${
                filter.value ? "TRUE" : "FALSE"
              } `,
            ),
          );
        } else if (fv.type === "full-text") {
          q.push(
            sql``
              .append(fv.val)
              .append(sql` ILIKE ${"%" + filter.value + "%"}`),
          );
        } else if (isObject(filter.value)) {
          // if value is a dictionary
          Object.keys(filter.value).forEach(function (key, _index) {
            let comparison = "";
            switch (key) {
              case "gt":
                comparison = ">";
                break;
              case "gte":
                comparison = ">=";
                break;
              case "lt":
                comparison = "<";
                break;
              case "lte":
                comparison = "<=";
                break;
              case "eq":
                comparison = "=";
              default:
                throw new Error(`unknown comparison: "${key}"`);
            }
            q.push(
              sql``
                .append(fv.val)
                .append(comparison)
                .append(sql` ${filter.value[key]}`),
            );
          });
        } else {
          q.push(sql``.append(fv.val).append(sql` = ${filter.value}`));
        }
      }
    } else {
      throw new Error(`unknown field: "${filter.id}"`);
    }
  }
  return q;
}

export function pathJoin2(p1: string, p2: string) {
  if (!p1) {
    return p2;
  }
  if (p1[p1.length - 1] === "/") {
    p1 = p1.slice(0, p1.length - 1);
  }
  if (p2 && p2[0] === "/") {
    p2 = p2.slice(1);
  }
  return p1 + "/" + (p2 || "");
}

export function pathJoin(...items: string[]) {
  return items.reduce(pathJoin2, "");
}

export function isFreeTierUser(user: User) {
  const isFreeTier =
    user.stripeProductId === "hacker_1" ||
    user.stripeProductId === "prod_O9XuIjn7EqYRVW";
  return isFreeTier;
}

export function trimPathPrefix(prefix: string, path: string) {
  const prefixIdx = path.indexOf(prefix);
  if (prefix[prefix.length - 1] !== "/") {
    const nextCharIdx = prefixIdx + prefix.length;
    if (nextCharIdx < path.length && path[nextCharIdx] !== "/") {
      return path;
    }
  }
  if (prefixIdx === 0) {
    return path.substr(prefix.length);
  }
  if (prefixIdx === 1 && path[0] === "/" && prefix[0] !== "/") {
    return path.substr(prefix.length + 1);
  }
  return path;
}

export async function recaptchaVerify(token: string, secretKey: string) {
  const recaptchaVerifyApiUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
  const headers = {
    "Content-Type": "application/json",
  };
  return await fetch(recaptchaVerifyApiUrl, {
    method: "POST",
    headers,
  })
    .then((res) => res.json())
    .then((res) => res.score);
}

export function isValidBase64(str: string) {
  try {
    // Decode the string and re-encode it
    const decoded = Buffer.from(str, "base64").toString("base64");
    // If the re-encoded string matches the original input, it's a valid base64 string
    return decoded === str;
  } catch (err) {
    // If there's an error during decoding, it's not a valid base64 string
    return false;
  }
}

export const triggerCatalystPullStart =
  process.env.NODE_ENV === "test"
    ? async () => {} // noop in case of tests
    : async (stream: DBStream, playbackUrl: string) => {
        const { lat, lon } = stream.pull?.location ?? {};
        if (lat && lon) {
          // Set the lat/lon qs to override the observed "client location" and
          // trigger the pull on the server closest to the requested location.
          const url = new URL(playbackUrl);
          url.searchParams.set("lat", lat.toString());
          url.searchParams.set("lon", lon.toString());
          playbackUrl = url.toString();
          console.log(
            `triggering catalyst pull start for streamId=${stream.id} playbackId=${stream.playbackId} lat=${lat} lon=${lon} pullRegion=${stream.pullRegion}, playbackUrl=${playbackUrl}`,
          );
        }

        const deadline = Date.now() + 2 * PULL_START_TIMEOUT;
        while (Date.now() < deadline) {
          const res = await fetchWithTimeoutAndRedirects(playbackUrl, {
            method: "GET",
            timeout: PULL_START_TIMEOUT,
            maxRedirects: 10,
          });
          const errHeader = res.headers.get("error");
          const isHlsErr =
            errHeader &&
            errHeader != "" &&
            !errHeader.includes("not allowed to view this stream");
          if (res.ok && !isHlsErr) {
            return;
          }

          const body = await res.text();
          logger.warn(
            `failed to trigger catalyst pull for stream=${
              stream.id
            } playbackUrl=${playbackUrl} status=${
              res.status
            } error=${JSON.stringify(body)}`,
          );
          await sleep(250);
        }

        throw new Error(`failed to trigger catalyst pull`);
      };

export const waitCatalystStreamReady =
  process.env.NODE_ENV === "test"
    ? async () => {} // noop in case of tests
    : async (stream: DBStream, playbackUrl: string) => {
        const metadataUrl = new URL(playbackUrl);
        metadataUrl.pathname = "/json_video+" + stream.playbackId + ".js";
        const url = metadataUrl.toString();

        const deadline = Date.now() + 2 * PULL_START_TIMEOUT;
        while (Date.now() < deadline) {
          const res = await fetchWithTimeoutAndRedirects(url, {
            method: "GET",
            timeout: PULL_START_TIMEOUT,
            maxRedirects: 10,
          });
          const body = await res.text();
          if (res.ok && body.includes(`"meta":`)) {
            return;
          }

          logger.warn(
            `getCatalystStreamMetadata failed for playbackUrl=${url} status=${
              res.status
            } error=${JSON.stringify(body)}`,
          );
          await sleep(250);
        }

        throw new Error(`failed to trigger catalyst pull`);
      };

export const triggerCatalystStreamStopSessions = (
  req: Request,
  playback_id: string,
) => triggerCatalystEvent(req, { resource: "stopSessions", playback_id });

export const triggerCatalystStreamUpdated = (
  req: Request,
  playback_id: string,
) => triggerCatalystEvent(req, { resource: "stream", playback_id });

async function triggerCatalystEvent(
  req: Request,
  payload: {
    resource: "stream" | "nuke" | "stopSessions";
    playback_id: string;
  },
) {
  const { catalystBaseUrl } = req.config;

  let url = `${catalystBaseUrl}/api/events`;
  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(
      `error dispatching event to catalyst url=${url} payload=${payload} status=${
        res.status
      } error=${await res.text()}`,
    );
  }
}

export function mapInputCreatorId(inputId: InputCreatorId): CreatorId {
  return typeof inputId === "string"
    ? { type: "unverified", value: inputId }
    : inputId;
}

export function getProjectId(req: Request): string {
  let projectId = req.user.defaultProjectId ?? "";
  if (req.project?.id) {
    projectId = req.project.id;
  }
  return projectId;
}

export async function deleteAllOwnedObjects(
  req: Request,
  params: {
    projectId?: string;
    userId?: string;
    deleted?: boolean;
  },
) {
  const filters: any = {};
  if (params.projectId) {
    filters.projectId = params.projectId;
  }
  if (params.userId) {
    filters.userId = params.userId;
  }
  if (params.deleted !== undefined) {
    filters.deleted = params.deleted;
  } else {
    filters.deleted = false;
  }

  let [assets] = await db.asset.find({ filters });
  let [streams] = await db.stream.find({ filters });
  let [signingKeys] = await db.signingKey.find({ filters });
  let [webhooks] = await db.webhook.find({ filters });
  let [sessions] = await db.session.find({ filters });

  for (const asset of assets) {
    await req.taskScheduler.deleteAsset(asset.id);
  }

  await db.stream.markDeletedMany(streams.map((s) => s.id));
  await db.signingKey.markDeletedMany(signingKeys.map((sk) => sk.id));
  await db.webhook.markDeletedMany(webhooks.map((w) => w.id));
  await db.session.markDeletedMany(sessions.map((s) => s.id));
}

export async function addDefaultProjectId(
  body: any,
  req: Request,
  res: Response,
) {
  const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };

  const enrichResponse = (document) => {
    if ("id" in document && "userId" in document) {
      if (
        (!document.projectId || document.projectId === "") &&
        req.user?.defaultProjectId
      ) {
        document.projectId = req.user.defaultProjectId;
      }
    }
  };

  const enrichResponseWithUserProjectId = async (document) => {
    if ("id" in document && "userId" in document) {
      if (!document.projectId) {
        if (document.user) {
          document.projectId = document.user.defaultProjectId;
        } else {
          let user =
            document.userId === req.user.id
              ? req.user
              : await db.user.get(document.userId, { useCache: true });
          if (user.defaultProjectId) {
            document.projectId = user.defaultProjectId;
          }
        }
      }
    }
  };

  const clonedBody = deepClone(body);

  const processItem = async (item) => {
    if (typeof item === "object" && item !== null) {
      if (req.user.admin) {
        await enrichResponseWithUserProjectId(item);
      } else {
        enrichResponse(item);
      }

      await Promise.all(
        Object.values(item).map(async (subItem) => {
          if (typeof subItem === "object" && subItem !== null) {
            if (req.user.admin) {
              await enrichResponseWithUserProjectId(subItem);
            } else {
              enrichResponse(subItem);
            }
          }
        }),
      );
    }
  };

  if (Array.isArray(clonedBody)) {
    await Promise.all(clonedBody.map((item) => processItem(item)));
  } else if (typeof clonedBody === "object" && clonedBody !== null) {
    await processItem(clonedBody);
  }

  return clonedBody;
}
