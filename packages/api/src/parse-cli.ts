import yargs from "yargs";
import { CamelKeys } from "./types/common";

function coerceArr(arg) {
  if (!Array.isArray(arg)) {
    const arr = [];
    for (const [key, value] of Object.entries(arg)) {
      arr[key] = value;
    }
    return arr;
  }
  return arg;
}

export type CliArgs = ReturnType<typeof parseCli>;

export default function parseCli(argv?: string | readonly string[]) {
  const parsed = yargs
    .usage(
      `
    Livepeer API Node

    Options my also be provided as LP_ prefixed environment variables, e.g. LP_PORT=5000 is the same as --port=5000.

    --broadcaster and --orchestrator options should be of the form
    [{"address":"https://127.0.0.1:3086","cliAddress":"http://127.0.0.1:3076"}]
    `
    )
    .env("LP_")
    //.strict(true)
    .options({
      port: {
        describe: "port to listen on",
        default: 3004,
        demandOption: true,
        type: "number",
      },
      "postgres-url": {
        describe: "url of a postgres database",
        type: "string",
        demandOption: true,
        default: "postgresql://postgres@localhost/livepeer",
      },
      "postgres-replica-url": {
        describe: "url of a postgres read replica database",
        type: "string",
      },
      "amqp-url": {
        describe: "the RabbitMQ Url",
        type: "string",
        default: "amqp://localhost:5672/livepeer",
      },
      "client-id": {
        describe: "google auth ID",
        type: "string",
      },
      "frontend-domain": {
        describe: "the domain used in templating urls, example: livepeer.org",
        type: "string",
      },
      "kube-namespace": {
        describe:
          "namespace of the Kubernetes cluster we're in. required for Kubernetes service discovery.",
        type: "string",
      },
      "kube-broadcaster-service": {
        describe: "name of the service we should look at for broadcasters.",
        type: "string",
      },
      "kube-broadcaster-template": {
        describe:
          "template string of the form https://{{nodeName}}.example.com to give broadcasters external identity.",
        type: "string",
        default: "https://{{nodeName}}.livepeer.live",
      },
      "kube-orchestrator-service": {
        describe: "name of the service we should look at for orchestrators.",
        type: "string",
      },
      "kube-orchestrator-template": {
        describe:
          "template string of the form {{ip}} for the broadcaster webhook.",
        type: "string",
        default: "https://{{ip}}:8935",
      },
      "http-prefix": {
        describe: "accept requests at this prefix",
        default: "/api",
        demandOption: true,
        type: "string",
      },
      "fallback-proxy": {
        describe:
          "if a request would otherwise be a 404, send it here instead. useful for dev.",
        type: "string",
      },
      "jwt-secret": {
        describe:
          "phrase used to sign JSON web token, a way to securely transmit information between parties",
        type: "string",
      },
      "jwt-audience": {
        describe: "identifies the recipients that the JWT is intended for",
        type: "string",
      },
      broadcasters: {
        describe:
          "hardcoded list of broadcasters to return from /api/broadcaster.",
        type: "string",
        default: "[]",
      },
      orchestrators: {
        describe:
          "hardcoded list of orchestrators to return from /api/orchestrator.",
        type: "string",
        default: "[]",
      },
      ingest: {
        describe: "hardcoded list of ingest points to return from /api/ingest.",
        type: "string",
        default: "[]",
      },
      prices: {
        describe:
          "hardcoded list of prices for broadcasters to return from /api/orchestrator/hook/auth",
        type: "string",
        default: "[]",
      },
      supportAddr: {
        describe:
          "email address where outgoing emails originate. should be of the form name/email@example.com",
        type: "string",
        coerce: (supportAddr) => {
          const split = supportAddr.split("/");
          if (split.length !== 2) {
            throw new Error(
              `supportAddr should be of the form name/email, got ${supportAddr}`
            );
          }
          return split;
        },
      },
      sendgridApiKey: {
        describe: "sendgrid api key for sending emails",
        type: "string",
      },
      segmentApiKey: {
        describe: "segment api key for tracking events",
        type: "string",
      },
      sendgridTemplateId: {
        describe: "sendgrid template id to use",
        type: "string",
      },
      insecureTestToken: {
        describe:
          "[DO NOT USE EXCEPT FOR TESTING] token that test harness can use to bypass validation and access the database",
        type: "string",
      },
      region: {
        describe:
          "list of ingest endpoints to use as options for /api/geolocate",
        type: "array",
        default: [],
        coerce: coerceArr,
      },
      "ingest-region": {
        describe:
          "list of ingest endpoints to use as servers to consult for /api/ingest",
        type: "array",
        default: [],
        coerce: coerceArr,
      },
      "api-region": {
        describe:
          "list of api endpoints to forward on incoming API requests. defining this delegates all non-geolocation tasks to the upstream servers",
        type: "array",
        default: [],
        coerce: coerceArr,
      },
      "record-object-store-id": {
        describe:
          "id of the object store that should be used for `record: true` requests that don't otherwise have an os",
        type: "string",
      },
      "supress-record-in-hook": {
        describe:
          "do not return record object store in /stream/hook response, even if it is specified in the stream object",
        type: "boolean",
      },
      "base-stream-name": {
        describe:
          "base stream name to be used in wildcard-based routing scheme.",
      },
      "own-region": {
        describe: "identify region in which this server runs (fra, mdw, etc)",
        type: "string",
      },
      consul: {
        describe: "url of the Consul agent",
        type: "string",
      },
      "mist-port": {
        describe: "port of the Mist server",
        default: 4242,
        type: "number",
      },
      "mist-username": {
        describe: "username for Mist server",
        type: "string",
      },
      "mist-password": {
        describe: "password for Mist server",
        type: "string",
      },
    })
    .help()
    .parse(argv);
  return parsed as any as CamelKeys<typeof parsed>;
}
