/**
 * Injects getOrchestrators() using a subgraph
 */

import fetch from "node-fetch";
import { OrchestratorNodeAddress } from "../types/common";

const defaultScore = 0;

export default function subgraphMiddleware({
  subgraphUrl,
}: {
  subgraphUrl: string;
}) {
  const CACHE_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 2 hours

  const blockList = {
    "0x3e2b450c0c499d8301146367680e067cd009db93": true,
    "0x23ca66656701ea524c92c5040cf022bd1bf8a4f8": true,
    "0x2559ae126336207c93060ed626f8bdefd998b66f": true,
    // TODO: Remove these addresses after some time for upgrading to >= v0.5.18
    "0xbaec9a6508b8270f4ff61049502d19cfe6ba428b": true,
    "0xd84781e1a9b74d71ea76cda8bb9f30893bfd00d1": true,
    "0xfb9849b0b53f66b747bfa47396964a3fa22400a0": true,
    "0xc08dbaf4fe0cbb1d04a14b13edef38526976f2fb": true,
    "0x2a15f9e60968451780bd2d09ca4e8c4498f168c3": true,
  };

  let cachedResp: Array<OrchestratorNodeAddress> = [];
  let lastCachedRespUpdate = 0;

  const getOrchestrators = async () => {
    const query = `
      {
        transcoders(where: { active: true }) {
          id
          serviceURI
        }
      }
    `;

    if (lastCachedRespUpdate + CACHE_REFRESH_INTERVAL < Date.now()) {
      try {
        const res = await fetch(subgraphUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query }),
        });

        const transcoders = (await res.json()).data.transcoders;
        const cacheUpdate: Array<OrchestratorNodeAddress> = [];
        for (const tr of transcoders) {
          if (tr.id.toLowerCase() in blockList) {
            continue;
          }

          cacheUpdate.push({
            address: tr.serviceURI,
            score: defaultScore,
          });
        }

        cachedResp = cacheUpdate;
        lastCachedRespUpdate = Date.now();
      } catch (e) {
        console.error(e);
      }
    }

    return cachedResp;
  };

  return (req, res, next) => {
    if (subgraphUrl) {
      req.orchestratorsGetters.push(getOrchestrators);
    }

    return next();
  };
}
