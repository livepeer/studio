/**
 * For development/other specialized cases we can hardcode the list of broadcasters and orchestrators with
 * --broadcaster and --orchestrator CLI parameters. This implements those.
 */

import { RequestHandler } from "express";
import {
  Ingest,
  NodeAddress,
  OrchestratorNodeAddress,
  Price,
} from "../types/common";
import { CliArgs } from "../parse-cli";

// This is kept for backward compatibility with the old CLI arg parsing logic.
// It provided the JSON parsed values of the CLI args through getter functions
// in the request object. Now these args are parsed on the CLI arg parsing code
// but we still have a lot of code using the old getter functions.
export default function hardcodedNodes({
  broadcasters,
  orchestrators,
  ingest,
  prices,
}: Pick<
  CliArgs,
  "broadcasters" | "orchestrators" | "ingest" | "prices"
>): RequestHandler {
  return (req, res, next) => {
    if (!req.getBroadcasters) {
      req.getBroadcasters = async () => broadcasters as NodeAddress[];
    }
    if (orchestrators?.length) {
      req.orchestratorsGetters.push(
        async () => orchestrators as OrchestratorNodeAddress[],
      );
    }
    if (!req.getIngest) {
      req.getIngest = async () => ingest as Ingest[];
    }
    if (!req.getPrices) {
      req.getPrices = async () => prices as Price[];
    }
    return next();
  };
}
