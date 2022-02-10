/**
 * For development/other specialized cases we can hardcode the list of broadcasters and orchestrators with
 * --broadcaster and --orchestrator CLI parameters. This implements those.
 */

import { RequestHandler } from "express";
import { NodeAddress, OrchestratorNodeAddress } from "../types/common";

export interface Ingest {
  origin?: string;
  base?: string;
  ingest: string;
  playback: string;
}

export interface Price {
  address: string;
  priceInfo: {
    pricePerUnit: string;
    pixelsPerUnit: string;
  };
}

export default function hardcodedNodes({
  broadcasters,
  orchestrators,
  ingest,
  prices,
}): RequestHandler {
  try {
    broadcasters = JSON.parse(broadcasters);
    orchestrators = JSON.parse(orchestrators);
    ingest = JSON.parse(ingest);
    prices = JSON.parse(prices);
  } catch (e) {
    console.error(
      "Error parsing LP_BROADCASTERS, LP_ORCHESTRATORS, LP_INGEST and AND LP_PRICES"
    );
    throw e;
  }
  return (req, res, next) => {
    if (!req.getBroadcasters) {
      req.getBroadcasters = async () => broadcasters as NodeAddress[];
    }
    if (orchestrators?.length) {
      req.orchestratorsGetters.push(
        async () => orchestrators as OrchestratorNodeAddress[]
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
