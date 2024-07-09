import { Request, RequestHandler, Response, Router } from "express";
import logger from "../logger";
import { authorizer, validatePost } from "../middleware";
import { fetchWithTimeout } from "../util";
import { experimentSubjectsOnly } from "./experiment";
import { pathJoin2 } from "./helpers";

const AI_GATEWAY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const app = Router();

app.use(experimentSubjectsOnly("ai-generate"));

function registerGenerateHandler(
  name: string,
  defaultModel: string
): RequestHandler {
  const path = `/${name}`;
  return app.post(
    path,
    authorizer({}),
    validatePost(`${name}-payload`),
    async function proxyGenerate(req: Request, res: Response) {
      const { aiGatewayUrl } = req.config;
      if (!aiGatewayUrl) {
        res.status(500).json({ errors: ["AI Gateway URL is not set"] });
        return;
      }

      // TODO: Add support to the multipart payloads
      const apiUrl = pathJoin2(aiGatewayUrl, path);
      const payload = {
        model_id: defaultModel,
        ...req.body,
      };

      const response = await fetchWithTimeout(apiUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        timeout: AI_GATEWAY_TIMEOUT,
        headers: {
          "content-type": "application/json",
          "user-agent": "livepeer.studio",
        },
      });

      if (!response.ok) {
        logger.error(
          `Error from generate API ${path} status=${
            response.status
          } body=${await response.text()}`
        );
      }
      if (response.status >= 500) {
        return res.status(500).json({ errors: [`Failed to generate ${name}`] });
      }

      const body = await response.json();
      res.status(response.status).json(body);
    }
  );
}

registerGenerateHandler("text-to-image", "SG161222/RealVisXL_V4.0_Lightning");
registerGenerateHandler("image-to-image", "timbrooks/instruct-pix2pix");
registerGenerateHandler(
  "image-to-video",
  "stabilityai/stable-video-diffusion-img2vid-xt-1-1"
);
registerGenerateHandler("upscale", "stabilityai/stable-diffusion-x4-upscaler");

export default app;
