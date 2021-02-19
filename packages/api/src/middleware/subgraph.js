/**
 * Injects getOrchestrators() using a subgraph
 */

import fetch from "isomorphic-fetch";

export default function subgraphMiddleware({ subgraphUrl }) {
  const CACHE_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 2 hours

  const blockList = {
    "0x3e2b450c0c499d8301146367680e067cd009db93": true,
  };

  let cachedResp = [];
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

    const ret = cachedResp;
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
        for (const tr of transcoders) {
          if (tr.id.toLowerCase() in blockList) {
            continue;
          }

          ret.push({
            address: tr.serviceURI,
          });
        }
      } catch (e) {
        console.error(e);
      }

      cachedResp = ret;
      lastCachedRespUpdate = Date.now();
    }

    return ret;
  };

  return (req, res, next) => {
    if (subgraphUrl) {
      req.getOrchestrators = getOrchestrators;
    }

    return next();
  };
}
