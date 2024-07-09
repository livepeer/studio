// import 'express-async-errors' // it monkeypatches, i guess
import * as fcl from "@onflow/fcl";
import { Router } from "express";
import promBundle from "express-prom-bundle";
import proxy from "http-proxy-middleware";
import Stripe from "stripe";
import controllers from "./controllers";
import apiProxy from "./controllers/api-proxy";
import { setupTestTus, setupTus } from "./controllers/asset";
import { getBroadcasterHandler } from "./controllers/broadcaster";
import { pathJoin } from "./controllers/helpers";
import { regionsGetter } from "./controllers/region";
import streamProxy from "./controllers/stream-proxy";
import createFrontend from "./frontend";
import {
  authenticateWithCors,
  errorHandler,
  geolocateMiddleware,
  hardcodedNodes,
  healthCheck,
  insecureTest,
  subgraph,
} from "./middleware";
import { CliArgs } from "./parse-cli";
import makeStore from "./store";
import { cache } from "./store/cache";
import { PostgresParams } from "./store/db";
import { NotFoundError } from "./store/errors";
import Queue, { NoopQueue, RabbitQueue } from "./store/queue";
import { taskScheduler } from "./task/scheduler";
import WebhookCannon from "./webhooks/cannon";

enum OrchestratorSource {
  hardcoded = "hardcoded",
  subgraph = "subgraph",
  region = "region",
}

// Routes that should be whitelisted even when `apiRegion` is set
const GEOLOCATION_ENDPOINTS = [
  "broadcaster",
  "orchestrator",
  "ingest",
  "geolocate",
];

const PROM_BUNDLE_OPTS: promBundle.Opts = {
  includeUp: false,
  includeMethod: true,
  includePath: true,
  httpDurationMetricName: "livepeer_api_http_request_duration_seconds",
  urlValueParser: {
    extraMasks: [/[\da-z]{4}(?:\-[\da-z]{4}){3}/, /[\da-z]{16}/],
  },
};

const isTest =
  process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

export async function initDb(params: CliArgs, serviceName = "api") {
  const {
    postgresUrl,
    postgresReplicaUrl,
    postgresConnPoolSize: pgPoolSize,
    postgresJobsConnPoolSize: pgJobsPoolSize,
    postgresCreateTables: createTablesOnDb,
    ownRegion,
  } = params;

  const appName = ownRegion ? `${ownRegion}-${serviceName}` : serviceName;
  const pgBaseParams: PostgresParams = {
    postgresUrl,
    postgresReplicaUrl,
    createTablesOnDb,
    appName,
  };
  const [db, jobsDb, store] = await makeStore(
    { ...pgBaseParams, poolMaxSize: pgPoolSize },
    {
      ...pgBaseParams,
      poolMaxSize: pgJobsPoolSize,
      appName: `${appName}-jobs`,
    }
  );
  return { db, jobsDb, store };
}

export async function initClients(params: CliArgs, serviceName = "api") {
  const {
    defaultCacheTtl,
    ownRegion,
    stripeSecretKey,
    amqpUrl,
    amqpTasksExchange,
  } = params;

  const { db, jobsDb, store } = await initDb(params, serviceName);
  if (defaultCacheTtl > 0) {
    cache.init({ stdTTL: defaultCacheTtl });
  }

  // RabbitMQ
  const appName = ownRegion ? `${ownRegion}-${serviceName}` : serviceName;
  const queue: Queue = amqpUrl
    ? await RabbitQueue.connect(amqpUrl, appName, amqpTasksExchange)
    : new NoopQueue();

  process.on("beforeExit", (code) => {
    queue.close();
  });

  if (!stripeSecretKey) {
    console.warn(
      "Warning: Missing Stripe API key. In development, make sure to configure one in .env.local file."
    );
  }
  const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: "2020-08-27" })
    : null;

  return {
    db,
    jobsDb,
    store,
    queue,
    stripe,
  };
}

export default async function appRouter(params: CliArgs) {
  const {
    httpPrefix,
    frontendDomain,
    supportAddr,
    sendgridTemplateId,
    sendgridApiKey,
    vodObjectStoreId,
    vodCatalystObjectStoreId,
    secondaryVodObjectStoreId,
    recordCatalystObjectStoreId,
    secondaryRecordObjectStoreId,
    subgraphUrl,
    fallbackProxy,
    orchestrators = [],
    broadcasters = [],
    ingest = [],
    prices = [],
    corsJwtAllowlist,
    insecureTestToken,
    returnRegionInOrchestrator,
    halfRegionOrchestratorsUntrusted,
    frontend,
  } = params;

  if (supportAddr || sendgridTemplateId || sendgridApiKey) {
    if (!(supportAddr && sendgridTemplateId && sendgridApiKey)) {
      throw new Error(
        `Sending emails requires supportAddr, sendgridTemplateId, and sendgridApiKey`
      );
    }
  }

  const { db, jobsDb, store, queue, stripe } = await initClients(params);

  // Task Scheduler
  await taskScheduler.start(params, queue);

  // Webhooks Cannon
  const webhookCannon = new WebhookCannon({
    frontendDomain,
    sendgridTemplateId,
    sendgridApiKey,
    vodCatalystObjectStoreId,
    secondaryVodObjectStoreId,
    recordCatalystObjectStoreId,
    secondaryRecordObjectStoreId,
    supportAddr,
    skipUrlVerification: isTest,
    queue,
  });
  await webhookCannon.start();

  process.on("beforeExit", () => {
    webhookCannon.stop();
    taskScheduler.stop();
  });

  if (isTest) {
    await setupTestTus();
  } else if (vodObjectStoreId) {
    await setupTus(vodObjectStoreId);
  }

  // Logging, JSON parsing, store injection
  const app = Router();
  app.use(healthCheck);
  app.use(promBundle(PROM_BUNDLE_OPTS));

  app.use((req, res, next) => {
    req.orchestratorsGetters = [];
    req.store = store;
    req.config = params;
    req.frontendDomain = frontendDomain; // defaults to livepeer.studio
    req.queue = queue;
    req.taskScheduler = taskScheduler;
    req.stripe = stripe;
    next();
  });
  app.use(
    authenticateWithCors({
      cors: {
        anyOriginPathPrefixes: [
          pathJoin("/", httpPrefix, "/asset/upload/direct"),
          pathJoin("/", httpPrefix, "/asset/upload/tus"),
          pathJoin("/", httpPrefix, "/playback/"),
        ],
        jwtOrigin: corsJwtAllowlist,
        baseOpts: {
          credentials: true,
          exposedHeaders: ["*"],
        },
      },
    })
  );

  // stripe webhook requires raw body
  // https://github.com/stripe/stripe-node/issues/331
  const bodyParser = require("body-parser");
  app.use("/api/stripe/webhook", bodyParser.raw({ type: "*/*" }));
  app.use(bodyParser.json());

  if (insecureTestToken) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("tried to set insecureTestToken in production!");
    }
    app.use(`/${insecureTestToken}`, insecureTest());
  }

  app.use(hardcodedNodes({ orchestrators, broadcasters, ingest, prices }));

  if (returnRegionInOrchestrator) {
    app.use((req, res, next) => {
      req.orchestratorsGetters.push(() =>
        regionsGetter(halfRegionOrchestratorsUntrusted)
      );
      return next();
    });
  }

  if (subgraphUrl) {
    app.use(
      subgraph({
        subgraphUrl,
      })
    );
  }

  // Add a controller for each route at the /${httpPrefix} route
  const prefixRouter = Router(); // amalgamates our endpoints together and serves them out
  // hack because I forgot this one needs to get geolocated too :(
  prefixRouter.get(
    "/stream/:streamId/broadcaster",
    geolocateMiddleware({}),
    getBroadcasterHandler
  );
  for (const [name, controller] of Object.entries(controllers)) {
    // if we're operating in api-region mode, only handle geolocation traffic, forward the rest on
    if (
      params.apiRegion &&
      params.apiRegion.length > 0 &&
      !GEOLOCATION_ENDPOINTS.includes(name)
    ) {
      prefixRouter.use(`/${name}`, apiProxy);
    } else {
      prefixRouter.use(`/${name}`, controller);
    }
  }
  prefixRouter.use((req, res, next) => {
    throw new NotFoundError("not found");
  });
  app.use(httpPrefix, prefixRouter);
  // Special case: handle /stream proxies off that endpoint
  app.use("/stream", streamProxy);

  // fix for bad links
  app.get("/verify", (req, res) => {
    res.redirect(301, `${req.protocol}://${req.frontendDomain}${req.url}`);
  });

  // This far down, this would otherwise be a 404... hit up the fallback proxy if we have it.
  // Mostly this is used for proxying to the Next.js server in development.
  if (fallbackProxy) {
    app.use(proxy({ target: fallbackProxy, changeOrigin: true }));
  }

  let wwwHandler;
  if (frontend) {
    wwwHandler = await createFrontend();
  }
  const apiErrorHandler = errorHandler();

  if (frontend) {
    app.use((req, res, next) => {
      if (!req.path.startsWith(httpPrefix)) {
        return wwwHandler(req, res, next);
      }
      next();
    });
  }

  app.use(apiErrorHandler);

  // These parameters are required to use the fcl library, even though we don't use on-chain verification
  await fcl.config({
    "flow.network": "testnet",
    "accessNode.api": "https://access-testnet.onflow.org",
  });

  return {
    router: app,
    webhookCannon,
    taskScheduler,
    store,
    db,
    jobsDb,
    queue,
  };
}
