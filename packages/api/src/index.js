import express from "express";
import "express-async-errors"; // it monkeypatches, i guess
import morgan from "morgan";
import logger from "./logger";
import appRouter from "./app-router";
import "source-map-support/register";
import cors from "cors";

export default async function makeApp(params) {
  const {
    storage,
    dbPath,
    httpPrefix,
    port,
    postgresUrl,
    cloudflareNamespace,
    cloudflareAccount,
    cloudflareAuth,
    listen = true,
    clientId,
    trustedDomain,
    kubeNamespace,
    kubeBroadcasterService,
    kubeBroadcasterTemplate,
    kubeOrchestratorService,
    kubeOrchestratorTemplate,
    fallbackProxy,
    orchestrators,
    broadcasters,
    prices,
    s3Url,
    s3UrlExternal,
    s3Access,
    s3Secret,
    upstreamBroadcaster,
    insecureTestToken,
  } = params;
  // Storage init

  let listener;
  let listenPort;

  const close = async () => {
    process.off("SIGTERM", sigterm);
    process.off("unhandledRejection", unhandledRejection);
    listener.close();
    await store.close();
  };

  // Handle SIGTERM gracefully. It's polite, and Kubernetes likes it.
  const sigterm = handleSigterm(close);

  process.on("SIGTERM", sigterm);

  const unhandledRejection = (err) => {
    logger.error("fatal, unhandled promise rejection: ", err);
    err.stack && logger.error(err.stack);
    sigterm();
  };
  process.on("unhandledRejection", unhandledRejection);

  let router;
  let store;
  let db;
  try {
    const appRoute = await appRouter(params);
    router = appRoute.router;
    store = appRoute.store;
    db = appRoute.db;
  } catch (e) {
    console.error("Error on startup");
    console.error(e);
    throw e;
    // process.exit(1)
  }
  const app = express();
  const whitelist = [
    "https://livepeer.com",
    "https://livepeer.monster",
    "http://localhost:3000",
    /livepeerorg.vercel\.app$/,
    /\.livepeerorg.now\.sh$/,
  ];
  app.use(
    cors({
      origin: whitelist,
      credentials: true,
    })
  );
  app.use(
    morgan("dev", {
      skip: (req, res) => {
        if (req.path.startsWith("/_next")) {
          return true;
        }
        if (insecureTestToken) {
          if (req.originalUrl.includes(insecureTestToken)) {
            return true;
          }
        }
        return false;
      },
    })
  );
  app.use(router);

  if (listen) {
    await new Promise((resolve, reject) => {
      listener = app.listen(port, (err) => {
        if (err) {
          logger.error("Error starting server", err);
          return reject(err);
        }
        listenPort = listener.address().port;
        logger.info(
          `API server listening on http://0.0.0.0:${listenPort}${httpPrefix}`
        );
        resolve();
      });
    });
  }

  return {
    ...params,
    app,
    listener,
    port: listenPort,
    close,
    store,
    db,
  };
}

const handleSigterm = (close) => async () => {
  // Handle SIGTERM gracefully. It's polite, and Kubernetes likes it.
  logger.info("Got SIGTERM. Graceful shutdown start");
  let timeout = setTimeout(() => {
    logger.warn("Didn't gracefully exit in 5s, forcing");
    process.exit(1);
  }, 5000);
  try {
    await close();
  } catch (err) {
    logger.error("Error closing store", err);
    process.exit(1);
  }
  clearTimeout(timeout);
  logger.info("Graceful shutdown complete, exiting cleanly");
  process.exit(0);
};
