import { Crypto } from "@peculiar/webcrypto";
import { TextEncoder } from "util";
import { URL, parse as parseUrl } from "url";
import fetch from "node-fetch";
import SendgridMail from "@sendgrid/mail";
import SendgridClient from "@sendgrid/client";
import express from "express";
import sql from "sql-template-strings";
import { createHmac } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { db } from "../store";

const ITERATIONS = 10000;

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
    ["deriveBits", "deriveKey"]
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
    ["encrypt", "decrypt"]
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
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  let next = baseUrl;
  next.searchParams.set("cursor", nextCursor);
  return next.href;
}

export async function getS3PresignedUrl(
  vodObjectStoreId: string,
  objectKey: string
) {
  const store = await db.objectStore.get(vodObjectStoreId);
  const parsed = parseUrl(store.url);
  const [vodAccessKey, vodSecretAccessKey] = parsed.auth.split(":");
  const publicUrl = parsed.host;
  const [_, vodRegion, vodBucket] = parsed.path.split("/");
  let protocol = parsed.protocol;
  if (protocol.includes("+")) {
    protocol = protocol.split("+")[1];
  }

  const s3Configuration = {
    credentials: {
      accessKeyId: vodAccessKey,
      secretAccessKey: vodSecretAccessKey,
    },
    region: vodRegion,
    signingRegion: vodRegion,
    endpoint: `${protocol}//${vodAccessKey}:${vodSecretAccessKey}@${publicUrl}`,
    forcePathStyle: true,
  };

  const s3 = new S3Client(s3Configuration);
  const putCommand = new PutObjectCommand({
    Bucket: vodBucket,
    Key: objectKey,
  });
  const url = await getSignedUrl(s3, putCommand, { expiresIn: 15 * 60 }); // expires in seconds
  console.log(`Signed URL: ${url}`);
  return url;
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

export function sendgridValidateEmail(email: string, validationApiKey: string) {
  if (!validationApiKey) {
    return;
  }
  sendgridValidateEmailAsync(email, validationApiKey).catch((error) => {
    console.error(
      `Email address validation error email="${email}" error=`,
      error
    );
  });
}

async function sendgridValidateEmailAsync(
  email: string,
  validationApiKey: string
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
      `email="${email}" status=${statusCode} verdict=${verdict} body=${rawBody}`
  );
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

export function parseFilters(fieldsMap: FieldsMap, val: string) {
  const isObject = function (a) {
    return !!a && a.constructor === Object;
  };

  const q = [];
  if (!val) {
    return q;
  }
  if (!fieldsMap || Object.keys(fieldsMap).length === 0) {
    return q;
  }
  let json;
  try {
    json = JSON.parse(decodeURIComponent(val));
  } catch (e) {
    console.log("error decoding filters", e);
    return q;
  }
  if (!Array.isArray(json)) {
    return q;
  }
  for (const filter of json) {
    const fv = fieldsMap[filter.id];
    if (fv) {
      if (typeof fv === "string") {
        q.push(sql``.append(fv).append(sql` = ${filter.value}`));
      } else if (fv.val) {
        if (fv.type === "boolean") {
          q.push(
            sql``.append(
              `coalesce((${fv.val})::boolean, FALSE) IS ${
                filter.value ? "TRUE" : "FALSE"
              } `
            )
          );
        } else if (fv.type === "full-text") {
          q.push(
            sql``.append(fv.val).append(sql` LIKE ${"%" + filter.value + "%"}`)
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
              default:
                comparison = "=";
            }
            q.push(
              sql``
                .append(fv.val)
                .append(comparison)
                .append(sql` ${filter.value[key]}`)
            );
          });
        } else {
          q.push(sql``.append(fv.val).append(sql` = ${filter.value}`));
        }
      }
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
