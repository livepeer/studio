import { Request, Response, Router } from "express";
import logger from "../logger";
import { authorizer, validatePost } from "../middleware";
import { TextToImagePayload } from "../schema/types";
import { fetchWithTimeout } from "../util";
import { experimentSubjectsOnly } from "./experiment";
import { pathJoin2 } from "./helpers";

const AI_GATEWAY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

const app = Router();

app.use(experimentSubjectsOnly("ai-generate"));

app.post(
  "/text-to-image",
  authorizer({}),
  validatePost("text-to-image-payload"),
  async (req: Request, res: Response) => {
    const { aiGatewayUrl } = req.config;
    if (!aiGatewayUrl) {
      res.status(500).json({ errors: ["AI Gateway URL is not set"] });
      return;
    }

    const payload: TextToImagePayload = {
      model_id: "SG161222/RealVisXL_V4.0_Lightning",
      ...req.body,
    };

    const response = await fetchWithTimeout(
      pathJoin2(aiGatewayUrl, "/text-to-image"),
      {
        method: "POST",
        body: JSON.stringify(payload),
        timeout: AI_GATEWAY_TIMEOUT,
        headers: {
          "content-type": "application/json",
          "user-agent": "livepeer.studio",
        },
      },
    );

    if (!response.ok) {
      logger.error(
        `Failed to generate image status=${
          response.status
        } body=${await response.text()}`,
      );
      return res.status(500).json({ errors: ["Failed to generate image"] });
    }

    res.status(response.status).json(response.json());
  },
);

export default app;
