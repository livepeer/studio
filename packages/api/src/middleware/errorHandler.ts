import { ErrorRequestHandler } from "express";

import { isAPIError } from "../store/errors";

export default function errorHandler(): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    // If we throw any errors with numerical statuses, use them.
    if (isAPIError(err)) {
      res.status(err.status);
      return res.json({ errors: [err.message] });
    }
    res.status(500);
    console.error(err);
    return res.json({ errors: [err.stack] });
  };
}
