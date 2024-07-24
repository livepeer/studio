import crypto from "crypto";
import { Request, RequestHandler, Router } from "express";
import FormData from "form-data";
import multer from "multer";
import { BodyInit, Response } from "node-fetch";
import promclient from "prom-client";
import { v4 as uuid } from "uuid";
import logger from "../logger";
import { authorizer, validateFormData, validatePost } from "../middleware";
import { AiGenerateLog, TextToImagePayload } from "../schema/types";
import { db } from "../store";
import { BadRequestError } from "../store/errors";
import { fetchWithTimeout } from "../util";
import { experimentSubjectsOnly } from "./experiment";
import { pathJoin2 } from "./helpers";

const AI_GATEWAY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10485760 }, // 10MiB
});

const aiGenerateDurationMetric = new promclient.Histogram({
  name: "livepeer_api_ai_generate_duration",
  buckets: [100, 500, 1000, 2500, 5000, 10000, 30000, 60000],
  help: "Duration in milliseconds of the AI generation request",
  labelNames: ["type", "complexity"], // see aiGenerateMetricComplexity
});

// We divide obervations in "complexity" buckets. The complexity is only relevant on image generation pipelines that
// have num images and/or inference steps params. The complexity is based on the product of them.
function aiGenerateMetricComplexity(request: AiGenerateLog["request"]) {
  const numInferenceSteps =
    (request as TextToImagePayload)?.num_inference_steps ?? 50;
  const numImages = (request as TextToImagePayload)?.num_images_per_prompt ?? 1;
  // We divide by 200 to reduce cardinality of the metric.
  // The range goes from 0 to `200 * 20 / 200` = 20 maximum cardinality
  return Math.round((numInferenceSteps * numImages) / 200);
}

const app = Router();

app.use(experimentSubjectsOnly("ai-generate"));

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
  if (!("model_id" in req.body)) {
    form.append("model_id", defaultModel);
  }
  for (const [key, value] of Object.entries(req.body)) {
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

function logAiGenerateRequest(
  type: string,
  startedAt: number,
  request: AiGenerateLog["request"],
  status?: number,
  response?: any,
  error?: any,
): void {
  const success = !!status && status >= 200 && status < 300;
  if (!success) {
    logger.error(
      `Error from generate API type=${type} status=${status} body=${JSON.stringify(
        response,
      )}`,
    );
  }

  setImmediate(async () => {
    let log: AiGenerateLog;
    try {
      const errorStr = error ? String(error) : response?.details?.msg;
      log = {
        id: uuid(),
        type,
        startedAt,
        duration: (Date.now() - startedAt) / 1000,
        success,
        request,
        response,
        error: success ? undefined : errorStr,
      };
      log = await db.aiGenerateLog.create(log);

      const complexity = aiGenerateMetricComplexity(request);
      aiGenerateDurationMetric.observe({ type, complexity }, log.duration);
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
  name: string,
  defaultModel: string,
  isJSONReq = false,
): RequestHandler {
  const path = `/${name}`;
  const middlewares = isJSONReq
    ? [validatePost(`${name}-payload`)]
    : [multipart.any(), validateFormData(`${name}-payload`)];
  return app.post(
    path,
    authorizer({}),
    ...middlewares,
    async function proxyGenerate(req, res) {
      const { aiGatewayUrl } = req.config;
      if (!aiGatewayUrl) {
        res.status(500).json({ errors: ["AI Gateway URL is not set"] });
        return;
      }

      const startedAt = Date.now();
      const apiUrl = pathJoin2(aiGatewayUrl, path);
      const [body, request] = createPayload(req, isJSONReq, defaultModel);
      let gatewayRes: Response, response: any, error: any;
      try {
        gatewayRes = await fetchWithTimeout(apiUrl, {
          method: "POST",
          body,
          timeout: AI_GATEWAY_TIMEOUT,
          headers: isJSONReq ? { "content-type": "application/json" } : {},
        });

        response = await gatewayRes.json();
      } catch (err) {
        error = err;
      } finally {
        logAiGenerateRequest(
          name,
          startedAt,
          request,
          gatewayRes?.status,
          response,
          error,
        );
      }

      if (gatewayRes.status >= 500) {
        // Hide internal server error details from the user.
        return res.status(500).json({ errors: [`Failed to generate ${name}`] });
      }

      res.status(gatewayRes.status).json(response);
    },
  );
}

registerGenerateHandler(
  "text-to-image",
  "SG161222/RealVisXL_V4.0_Lightning",
  true,
);
registerGenerateHandler("image-to-image", "timbrooks/instruct-pix2pix");
registerGenerateHandler(
  "image-to-video",
  "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
);
registerGenerateHandler("upscale", "stabilityai/stable-diffusion-x4-upscaler");

export default app;
