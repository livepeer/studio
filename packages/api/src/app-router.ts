// import 'express-async-errors' // it monkeypatches, i guess
import Router from "express/lib/router";
import makeStore from "./store";
import {
  errorHandler,
  healthCheck,
  kubernetes,
  subgraph,
  hardcodedNodes,
  insecureTest,
  geolocateMiddleware,
} from "./middleware";
import controllers from "./controllers";
import streamProxy from "./controllers/stream-proxy";
import apiProxy from "./controllers/api-proxy";
import proxy from "http-proxy-middleware";
import { getBroadcasterHandler } from "./controllers/broadcaster";
import WebhookCannon from "./webhooks/cannon";
import Queue, { NoopQueue, RabbitQueue } from "./store/queue";
import Stripe from "stripe";
import { CliArgs } from "./parse-cli";
import { regionsGetter } from "./controllers/region";

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

export default async function makeApp(params: CliArgs) {
  const {
    httpPrefix = "/api",
    postgresUrl,
    postgresReplicaUrl,
    frontendDomain = "livepeer.com",
    supportAddr,
    sendgridTemplateId,
    sendgridApiKey,
    kubeNamespace,
    kubeBroadcasterService,
    kubeBroadcasterTemplate,
    kubeOrchestratorService,
    kubeOrchestratorTemplate,
    ownRegion,
    subgraphUrl,
    fallbackProxy,
    orchestrators = "[]",
    broadcasters = "[]",
    ingest = "[]",
    prices = "[]",
    insecureTestToken,
    stripeSecretKey,
    amqpUrl,
    returnRegionInOrchestrator,
  } = params;

  if (supportAddr || sendgridTemplateId || sendgridApiKey) {
    if (!(supportAddr && sendgridTemplateId && sendgridApiKey)) {
      throw new Error(
        `Sending emails requires supportAddr, sendgridTemplateId, and sendgridApiKey`
      );
    }
  }

  // Storage init
  const bodyParser = require("body-parser");
  const [db, store] = await makeStore({
    postgresUrl,
    postgresReplicaUrl,
    appName: ownRegion ? `${ownRegion}-api` : "api",
  });

  // RabbitMQ
  const queue: Queue = amqpUrl
    ? await RabbitQueue.connect(amqpUrl)
    : new NoopQueue();

  // Webhooks Cannon
  const webhookCannon = new WebhookCannon({
    db,
    store,
    verifyUrls: true,
    queue,
  });
  await webhookCannon.start();

  process.on("beforeExit", (code) => {
    queue.close();
    webhookCannon.stop();
  });

  if (!stripeSecretKey) {
    console.warn(
      "Warning: Missing Stripe API key. In development, make sure to configure one in .env.local file."
    );
  }
  const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, { apiVersion: "2020-08-27" })
    : null;
  // Logging, JSON parsing, store injection

  const app = Router();
  app.use(healthCheck);

  // stripe webhook requires raw body
  // https://github.com/stripe/stripe-node/issues/331
  app.use("/api/stripe/webhook", bodyParser.raw({ type: "*/*" }));

  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.orchestratorsGetters = [];
    req.store = store;
    req.config = params;
    req.frontendDomain = frontendDomain; // defaults to livepeer.com
    req.queue = queue;
    req.stripe = stripe;
    next();
  });
  if (insecureTestToken) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("tried to set insecureTestToken in production!");
    }
    app.use(`/${insecureTestToken}`, insecureTest());
  }

  // Populate Kubernetes getOrchestrators and getBroadcasters is provided
  if (kubeNamespace) {
    app.use(
      kubernetes({
        kubeNamespace,
        kubeBroadcasterService,
        kubeOrchestratorService,
        kubeBroadcasterTemplate,
        kubeOrchestratorTemplate,
      })
    );
  }

  app.use(hardcodedNodes({ orchestrators, broadcasters, ingest, prices }));

  if (returnRegionInOrchestrator) {
    app.use((req, res, next) => {
      req.orchestratorsGetters.push(regionsGetter);
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
  app.use(errorHandler());

  return {
    router: app,
    webhookCannon,
    store,
    db,
    queue,
  };
}
