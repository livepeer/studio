import express from "express";
import "express-async-errors"; // it monkeypatches, i guess
import { Server } from "http";
import morgan from "morgan";
import { AddressInfo } from "net";
import "source-map-support/register";
import { collectDefaultMetrics, Gauge } from "prom-client";

import appRouter from "./app-router";
import logger from "./logger";
import { CliArgs } from "./parse-cli";
import tracking from "./middleware/tracking";

export type AppServer = Awaited<ReturnType<typeof makeApp>>;

const prefix = "livepeer_api_";
collectDefaultMetrics({ prefix });

function getGitHash(): string {
  let version = process.env.VERSION || process.env.GITHUB_SHA;
  if (!version) {
    try {
      version = require("child_process")
        .execSync("git rev-parse HEAD")
        .toString()
        .trim();
    } catch (e) {
      // Oh well
    }
  }
  return version || "undefined";
}

export default async function makeApp(params: CliArgs) {
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
    amqpUrl,
  } = params;
  // Storage init

  let listener: Server;
  let listenPort: number;

  const close = async () => {
    process.off("SIGTERM", sigterm);
    process.off("unhandledRejection", unhandledRejection);
    listener?.close();
    await tracking.flushAll();
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

  const appRoute = await appRouter(params).catch((e) => {
    console.error("Error on startup");
    console.error(e);
    throw e;
    // process.exit(1)
  });
  const {
    db,
    queue,
    router,
    store,
    webhookCannon: webhook,
    taskScheduler,
  } = appRoute;

  const app = express();
  const isSilentTest =
    process.env.NODE_ENV === "test" && process.argv.indexOf("--silent") > 0;
  app.use(
    morgan("dev", {
      skip: (req, res) => {
        if (isSilentTest) {
          return true;
        }
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
    let version = new Gauge({
      name: "version",
      help: "Versions used by livepeer api node",
      labelNames: ["nodeversion", "version", "app", "os", "arch"],
    });
    version.set(
      {
        nodeversion: process.version,
        arch: process.arch,
        os: process.platform,
        version: getGitHash(),
        app: "studio-api",
      },
      1
    );
    await new Promise<void>((resolve, reject) => {
      listener = app.listen(port, () => {
        const address = listener.address() as AddressInfo;
        listenPort = address.port;
        logger.info(
          `API server listening on http://0.0.0.0:${listenPort}${httpPrefix}`
        );
        resolve();
      });
      listener.on("error", (err) => {
        logger.error("Error starting server", err);
        reject(err);
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
    webhook,
    taskScheduler,
    queue,
  };
}

const handleSigterm = (close: () => Promise<void>) => async () => {
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
