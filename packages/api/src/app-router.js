// import 'express-async-errors' // it monkeypatches, i guess
import Router from "express/lib/router";
import bearerToken from "express-bearer-token";
import makeStore from "./store";
import {
  errorHandler,
  healthCheck,
  kubernetes,
  hardcodedNodes,
  insecureTest,
  geolocateMiddleware,
} from "./middleware";
import controllers from "./controllers";
import streamProxy from "./controllers/stream-proxy";
import apiProxy from "./controllers/api-proxy";
import proxy from "http-proxy-middleware";
import { getBroadcasterHandler } from "./controllers/broadcaster";
import schema from "./schema/schema.json";
import WebhookCannon from "./webhooks/cannon";
import MessageQueue from "./store/rabbit-queue";
import { setSendgridConfig } from "./controllers/helpers";

// Routes that should be whitelisted even when `apiRegion` is set
const GEOLOCATION_ENDPOINTS = [
  "broadcaster",
  "orchestrator",
  "ingest",
  "geolocate",
];

export default async function makeApp(params) {
  const {
    storage,
    dbPath,
    httpPrefix = "/api",
    port,
    postgresUrl,
    postgresReplicaUrl,
    cloudflareNamespace,
    cloudflareAccount,
    cloudflareAuth,
    listen = true,
    clientId,
    frontendDomain = "livepeer.com",
    frontendProtocol = "https",
    jwtSecret,
    jwtAudience,
    supportAddr,
    sendgridTemplateId,
    sendgridApiKey,
    segmentApiKey,
    kubeNamespace,
    kubeBroadcasterService,
    kubeBroadcasterTemplate,
    kubeOrchestratorService,
    kubeOrchestratorTemplate,
    fallbackProxy,
    orchestrators = "[]",
    broadcasters = "[]",
    ingest = "[]",
    prices = "[]",
    insecureTestToken,
    firestoreCredentials,
    firestoreCollection,
    amqpUrl,
  } = params;

  if (supportAddr || sendgridTemplateId || sendgridApiKey) {
    if (!(supportAddr && sendgridTemplateId && sendgridApiKey)) {
      throw new Error(
        `Sending emails requires supportAddr, sendgridTemplateId, and sendgridApiKey`
      );
    }
    setSendgridConfig({
      supportAddr,
      sendgridTemplateId,
      sendgridApiKey,
      frontendDomain,
      frontendProtocol,
    });
  }

  // Storage init
  const bodyParser = require("body-parser");
  const [db, store] = await makeStore({
    postgresUrl,
    postgresReplicaUrl,
    schema,
  });

  // RabbitMQ
  const queue = new MessageQueue();
  await queue.connect(amqpUrl);
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
  // Logging, JSON parsing, store injection

  const app = Router();
  app.use(healthCheck);

  // stripe webhook requires raw body
  // https://github.com/stripe/stripe-node/issues/331
  app.use("/api/stripe/webhook", bodyParser.raw({ type: "*/*" }));

  app.use(bodyParser.json());
  app.use((req, res, next) => {
    req.store = store;
    req.config = params;
    req.frontendDomain = frontendDomain; // defaults to livepeer.com
    req.queue = queue;
    next();
  });
  if (insecureTestToken) {
    if (process.NODE_ENV === "production") {
      throw new Error("tried to set insecureTestToken in production!");
    }
    app.use(`/${insecureTestToken}`, insecureTest());
  }
  app.use(bearerToken());

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
