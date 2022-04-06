/**
 * Injects getOrchestrators() using a subgraph
 */

import { fetchWithTimeout } from "../util";
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
  };

  const SUBGRAPH_TIMEOUT = 3 * 1000;

  let cachedResp: Array<OrchestratorNodeAddress> = [];
  let lastCachedRespUpdate = 0;

  const getCurrentRound = async () => {
    const res = await fetchWithTimeout(subgraphUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: `{ protocol(id: "0") { lastInitializedRound { id } } }`,
      }),
      timeout: SUBGRAPH_TIMEOUT,
    });

    return +(await res.json()).data.protocol.lastInitializedRound.id;
  };

  const getOrchestrators = async () => {
    if (lastCachedRespUpdate + CACHE_REFRESH_INTERVAL < Date.now()) {
      try {
        const currentRound = await getCurrentRound();
        const query = `
          {
            transcoders(where: { activationRound_lte: "${
              currentRound + 1
            }", deactivationRound_gt: "${currentRound}" }) {
              id
              serviceURI
            }
          }
        `;

        const res = await fetchWithTimeout(subgraphUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query }),
          timeout: SUBGRAPH_TIMEOUT,
        });

        const transcoders = (await res.json()).data.transcoders;
        cachedResp = transcoders
          .filter(
            (tr) => !(tr.id.toLowerCase() in blockList) && !!tr.serviceURI
          )
          .map((tr) => ({ address: tr.serviceURI, score: defaultScore }));

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
