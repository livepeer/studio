/**
 * Injects getOrchestrators() using a subgraph
 */

import fetch from "isomorphic-fetch";

export default function subgraphMiddleware({ subgraphUrl }) {
  const CACHE_REFRESH_INTERVAL = 12 * 60 * 60 * 1000; // 2 hours

  const blockList = {
    "0x3e2b450c0c499d8301146367680e067cd009db93": true,
    "0x23ca66656701ea524c92c5040cf022bd1bf8a4f8": true,
    "0x2559ae126336207c93060ed626f8bdefd998b66f": true,
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
        const cacheUpdate = []
        for (const tr of transcoders) {
          if (tr.id.toLowerCase() in blockList) {
            continue;
          }

          cacheUpdate.push({
            address: tr.serviceURI,
          });
        }

        cachedResp = cacheUpdate
        lastCachedRespUpdate = Date.now();
      } catch (e) {
        console.error(e);
      }
    }

    return cachedResp;
  };

  return (req, res, next) => {
    if (subgraphUrl) {
      req.getOrchestrators = getOrchestrators;
    }

    return next();
  };
}
