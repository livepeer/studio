import crypto from "isomorphic-webcrypto";
import util from "util";
import fetch from "node-fetch";
import SendgridMail from "@sendgrid/mail";
import sql from "sql-template-strings";
import { createHmac } from "crypto";
import { Histogram } from "prom-client";

import { db } from "../store";

let Encoder;
if (typeof TextEncoder === "undefined") {
  Encoder = util.TextEncoder;
} else {
  Encoder = TextEncoder;
}

const ITERATIONS = 10000;
const segmentMetrics = new Histogram({
  name: "livepeer_api_segment_request_duration_seconds",
  help: "duration histogram of http calls to segment.io APIs",
  labelNames: ["endpoint", "status_code"],
  buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
});

export function sign(data, secret) {
  const hmac = createHmac("sha256", secret);
  hmac.update(Buffer.from(data));
  return hmac.digest("hex");
}

export async function hash(password, salt) {
  let saltBuffer;
  if (salt) {
    saltBuffer = fromHexString(salt);
  } else {
    saltBuffer = crypto.getRandomValues(new Uint8Array(8));
  }

  var encoder = new Encoder("utf-8");
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

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

function bytesToHexString(bytes, separate) {
  /// <signature>
  ///     <summary>Converts an Array of bytes values (0-255) to a Hex string</summary>
  ///     <param name="bytes" type="Array"/>
  ///     <param name="separate" type="Boolean" optional="true">Inserts a separator for display purposes (default = false)</param>
  ///     <returns type="String" />
  /// </signature>

  var result = "";
  if (typeof separate === "undefined") {
    separate = false;
  }

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

export function makeNextHREF(req, nextCursor) {
  let baseUrl = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  let next = baseUrl;
  next.searchParams.set("cursor", nextCursor);
  return next.href;
}

export async function sendgridEmail({
  email,
  supportAddr,
  sendgridTemplateId,
  sendgridApiKey,
  subject,
  preheader,
  text,
  buttonText,
  buttonUrl,
  unsubscribe,
}) {
  const [supportName, supportEmail] = supportAddr;
  const msg = {
    personalizations: [
      {
        to: [{ email: email }],
        dynamic_template_data: {
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
    template_id: sendgridTemplateId,
  };

  SendgridMail.setApiKey(sendgridApiKey);
  await SendgridMail.send(msg);
}

export async function trackAction(userId, email, event, apiKey) {
  if (!apiKey) {
    return;
  }

  const identifyInfo = {
    userId,
    traits: {
      email,
    },
    email,
  };
  await fetchSegmentApi(identifyInfo, "identify", apiKey);

  let properties = {};
  if ("properties" in event) {
    properties = { ...properties, ...event.properties };
  }

  const trackInfo = {
    userId,
    event: event.name,
    email,
    properties,
  };

  await fetchSegmentApi(trackInfo, "track", apiKey);
}

export async function fetchSegmentApi(body, endpoint, apiKey) {
  const timer = segmentMetrics.startTimer();
  const segmentApiUrl = "https://api.segment.io/v1";

  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
  };

  let response = await fetch(`${segmentApiUrl}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: headers,
  });
  const labels = { endpoint, status_code: response.status };
  timer(labels);
}

export async function getWebhooks(
  store,
  userId,
  event,
  limit = 100,
  cursor = undefined,
  includeDeleted = false
) {
  const query = [sql`data->>'userId' = ${userId}`];
  if (event) {
    query.push(sql`data->>'event' = ${event}`);
  }
  if (!includeDeleted) {
    query.push(sql`data->>'deleted' IS NULL`);
  }
  const [webhooks, nextCursor] = await db.webhook.find(query, {
    limit,
    cursor,
  });

  return { data: webhooks, cursor: nextCursor };
}

export function parseOrder(fieldsMap, val) {
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

export function parseFilters(fieldsMap, val) {
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

export function pathJoin2(p1, p2) {
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

export function pathJoin(...items) {
  return items.reduce(pathJoin2, "");
}

export function trimPathPrefix(prefix, path) {
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

export async function recaptchaVerify(token, secretKey) {
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
