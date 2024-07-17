import { ErrorRequestHandler } from "express";
import multer from "multer";

import logger from "../logger";
import { isAPIError } from "../store/errors";

export default function errorHandler(): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    // If we throw any errors with numerical statuses, use them.
    if (isAPIError(err)) {
      return res.status(err.status).json({ errors: [err.message] });
    }
    // multipart form errors are always bad input-related
    if (err instanceof multer.MulterError) {
      return res.status(422).json({ errors: [err.message] });
    }

    logger.error(
      `Unhandled error in API path=${_req.path} errType=${err.name} err="${err.message}" stack=${err.stack}`,
    );
    return res
      .status(500)
      .json({ errors: [`Internal server error: ${err.name || err.message}`] });
  };
}
