import crypto from "crypto";
import { Request, RequestHandler, Router } from "express";
import FormData from "form-data";
import multer from "multer";
import { BodyInit, Response as FetchResponse } from "node-fetch";
import promclient from "prom-client";
import sql from "sql-template-strings";
import { v4 as uuid } from "uuid";
import logger from "../logger";
import { authorizer, validateFormData, validatePost } from "../middleware";
import { defaultModels } from "../schema/pull-ai-schema";
import { AiGenerateLog } from "../schema/types";
import { db } from "../store";
import { BadRequestError } from "../store/errors";
import { fetchWithTimeout, kebabToCamel } from "../util";
import { experimentSubjectsOnly } from "./experiment";
import { pathJoin2 } from "./helpers";

const AI_GATEWAY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

type AiGenerateType = AiGenerateLog["type"];

const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10485760 }, // 10MiB
});

const aiGenerateDurationMetric = new promclient.Histogram({
  name: "livepeer_api_ai_generate_duration",
  buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000],
  help: "Duration in milliseconds of the AI generation request",
  labelNames: ["type", "status_code"],
});

const app = Router();

// TODO: Remove beta paths middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/beta/generate")) {
    req.url = req.url.replace("/beta/generate", "/generate");
  }
  next();
});

const rateLimiter: RequestHandler = async (req, res, next) => {
  const now = Date.now();
  const [[{ count, min }]] = await db.aiGenerateLog.find(
    [
      sql`data->>'userId' = ${req.user.id}`,
      sql`data->>'startedAt' >= ${now - RATE_LIMIT_WINDOW}`, // do not convert to bigint to use index
    ],
    {
      order: null,
      fields: "COUNT(*) as count, MIN((data->>'startedAt')::bigint) as min",
      process: (row) => row, // avoid extracting `data` field from result rows
    },
  );
  const numRecentReqs = parseInt(count);
  const minStartedAt = parseInt(min);

  if (numRecentReqs >= req.config.aiMaxRequestsPerMinutePerUser) {
    let retryAfter = (minStartedAt + RATE_LIMIT_WINDOW - now) / 1000;
    retryAfter = Math.max(Math.ceil(retryAfter), 1);
    logger.info(
      `Rate-limiting too many AI requests from userId=${req.user.id} userEmail=${req.user.email} ` +
        `numRecentReqs=${numRecentReqs} minStartedAt=${minStartedAt} now=${now} retryAfter=${retryAfter}`,
    );

    res.set("Retry-After", `${retryAfter}`);
    return res.status(429).json({ errors: ["Too many AI requests"] });
  }

  next();
};

function createPayload(
  req: Request,
  isJSONReq: boolean,
  defaultModel: string,
): [BodyInit, AiGenerateLog["request"]] {
  const payload = {
    model_id: defaultModel,
    ...req.body,
  };
  if (isJSONReq) {
    return [JSON.stringify(payload), payload];
  }
  if (!Array.isArray(req.files)) {
    throw new BadRequestError("Expected an array of files");
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    form.append(key, value);
  }
  for (const file of req.files) {
    form.append(file.fieldname, file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: file.size,
    });
    // We save only the hash of the file on the `payload` since that will be saved in the DB.
    // TODO: Make this save the contents of the file in some OS and only reference them here.
    const fileHash = crypto
      .createHash("sha256")
      .update(file.buffer)
      .digest("hex");
    payload[file.fieldname] = fileHash;
  }
  return [form, payload];
}

function parseOptionalJson(buf: Buffer): any {
  const str = buf?.toString();
  if (!str) {
    return str;
  }
  try {
    return JSON.parse(str);
  } catch (err) {
    return str;
  }
}

function logAiGenerateRequest(
  userId: string,
  projectId: string,
  type: AiGenerateType,
  startedAt: number,
  request: AiGenerateLog["request"],
  statusCode?: number,
  responseBuf?: Buffer,
  error?: any,
): void {
  const durationMs = Date.now() - startedAt;
  const success = !error && statusCode && statusCode >= 200 && statusCode < 300;
  if (!success) {
    logger.error(
      `Error from generate API type=${type} status=${statusCode} body=${responseBuf} error=${error}`,
    );
  }

  setImmediate(async () => {
    let log: AiGenerateLog;
    try {
      const response = parseOptionalJson(responseBuf);
      const errorStr = error ? String(error) : response?.details?.msg;
      log = {
        id: uuid(),
        userId,
        projectId,
        type,
        startedAt,
        durationMs,
        success,
        request,
        statusCode,
        response,
        error: success ? undefined : errorStr,
      };
      log = await db.aiGenerateLog.create(log);

      aiGenerateDurationMetric.observe(
        { type, status_code: statusCode },
        durationMs,
      );
    } catch (err) {
      logger.error(
        `Failed to save AI generation log type=${type} log=${JSON.stringify(
          log,
        )} err=${err}`,
      );
    }
  });
}

function registerGenerateHandler(
  type: AiGenerateType,
  isJSONReq = false, // multipart by default
): RequestHandler {
  const path = `/${type}`;

  let payloadParsers: RequestHandler[];
  let camelType = kebabToCamel(type);
  camelType = camelType[0].toUpperCase() + camelType.slice(1);
  if (isJSONReq) {
    payloadParsers = [validatePost(`${camelType}Params`)];
  } else {
    payloadParsers = [
      multipart.any(),
      validateFormData(`Body_gen${camelType}`),
    ];
  }

  const defaultModel = defaultModels[type];

  return app.post(
    path,
    authorizer({}),
    ...payloadParsers,
    rateLimiter,
    async function proxyGenerate(req, res) {
      const { aiGatewayUrl } = req.config;
      if (!aiGatewayUrl) {
        res.status(500).json({ errors: ["AI Gateway URL is not set"] });
        return;
      }

      const startedAt = Date.now();
      const apiUrl = pathJoin2(aiGatewayUrl, path);
      const [body, request] = createPayload(req, isJSONReq, defaultModel);
      let gatewayRes: FetchResponse, response: Buffer, error: any;
      try {
        gatewayRes = await fetchWithTimeout(apiUrl, {
          method: "POST",
          body,
          timeout: AI_GATEWAY_TIMEOUT,
          headers: isJSONReq ? { "content-type": "application/json" } : {},
        });

        response = await gatewayRes.buffer();
      } catch (err) {
        error = err;
      } finally {
        logAiGenerateRequest(
          req.user.id,
          req.project?.id,
          type,
          startedAt,
          request,
          gatewayRes?.status,
          response,
          error,
        );
        if (error) {
          throw error;
        }
      }

      if (!req.user.admin && gatewayRes.status >= 500) {
        // We hide internal server error details from the user.
        return res.status(500).json({ errors: [`Failed to generate ${type}`] });
      }

      // forward content metadata headers
      for (const [key, value] of gatewayRes.headers.entries()) {
        if (key.toLowerCase().startsWith("content-")) {
          res.set(key, value);
        }
      }
      res.status(gatewayRes.status).send(response);
    },
  );
}

registerGenerateHandler("text-to-image", true);
registerGenerateHandler("image-to-image");
registerGenerateHandler("image-to-video");
registerGenerateHandler("upscale");
registerGenerateHandler("audio-to-text");
registerGenerateHandler("segment-anything-2");

export default app;
