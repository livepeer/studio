import { ErrorObject, ValidateFunction } from "ajv";
import Yargs, { Argv, Options } from "yargs";
import { FfmpegProfile } from "./schema/types";
import profileValidator from "./schema/validators/ffmpeg-profile";
import { defaultTaskExchange } from "./store/queue";
import {
  CamelKeys,
  Ingest,
  NodeAddress,
  OrchestratorNodeAddress,
  Price,
} from "./types/common";
import yargsToMist from "./yargs-to-mist";

const DEFAULT_ARWEAVE_GATEWAY_PREFIXES = [
  "https://arweave.net/",
  "https://gateway.arweave.net/",
];

const JOB_TYPES = [
  "active-cleanup",
  "create-db-tables",
  "update-usage",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

const yargs = Yargs() as unknown as Argv;

function coerceArr(arg: any) {
  if (!Array.isArray(arg)) {
    const arr = [];
    for (const [key, value] of Object.entries(arg)) {
      arr[key] = value;
    }
    return arr;
  }
  return arg;
}

function coerceJsonStrArr(arg: string): string[] {
  if (!arg) {
    return undefined;
  }
  const arr = JSON.parse(arg);
  const isStrArr =
    Array.isArray(arr) && arr.every((str) => typeof str === "string");
  if (!isStrArr) {
    throw new Error("not a JSON array of strings");
  }
  return arr;
}

function coerceRegexList(flagName: string) {
  return (arg: string): (string | RegExp)[] => {
    try {
      const arr = coerceJsonStrArr(arg);
      if (!arr) {
        return undefined;
      }
      return arr.map((str) => {
        if (str.startsWith("/") && str.endsWith("/")) {
          return new RegExp(str.slice(1, -1));
        }
        return str;
      });
    } catch (err) {
      throw new Error(`Error in CLI flag --${flagName}: ${err.message}`);
    }
  };
}

function coerceJsonValue<T>(flagName: string) {
  return (arg: string): T => {
    if (!arg) {
      return undefined;
    }

    try {
      return JSON.parse(arg);
    } catch (err) {
      throw new Error(`Error in CLI flag --${flagName}: ${err.message}`);
    }
  };
}

function coerceJsonProfileArr(flagName: string) {
  return (str: string): FfmpegProfile[] => {
    let profiles;
    const validator = profileValidator as any as ValidateFunction;
    try {
      profiles = JSON.parse(str);
    } catch (e) {
      throw new Error(`--${flagName} JSON parsing error: ${e.message}`);
    }
    if (!Array.isArray(profiles)) {
      throw new Error(`--${flagName} must be a JSON array`);
    }
    const errors: ErrorObject[] = [];
    for (const profile of profiles) {
      const valid = validator(profile);
      if (!valid) {
        errors.push(...validator.errors);
      }
    }
    if (errors.length > 0) {
      throw new Error(
        `--${flagName} validation error: ${JSON.stringify(errors)}`,
      );
    }
    return profiles;
  };
}

export type CliArgs = ReturnType<typeof parseCli>;

// Hack alert! We need to capture the args passed to yarns.options to generate the
// mist compatible config on -j. But assigning the `.options()` object to a variable
// before passing it to yargs completely breaks type inference, which is a huge shame.
// So... this monkeypatches yargs to capture that variable. If you know of a more
// elegant way, I'd love to hear it!
let allOptions: { [key: string]: Options };
const originalOpts = yargs.options;
yargs.options = function (...args) {
  if (!allOptions) {
    allOptions = args[0];
  }
  return originalOpts.call(this, ...args);
};

export default function parseCli(argv?: string | readonly string[]) {
  if (!argv) {
    argv = process.argv.slice(2);
  }
  const parsedProm = yargs
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
        default: "postgresql://postgres@127.0.0.1/livepeer",
      },
      "postgres-replica-url": {
        describe: "url of a postgres read replica database",
        type: "string",
      },
      "postgres-conn-pool-size": {
        describe: "size of the main postgres connection pool",
        type: "number",
        default: 10,
      },
      "postgres-jobs-conn-pool-size": {
        describe:
          "size of the postgres connection pool used for background jobs",
        type: "number",
        default: 5,
      },
      "postgres-create-tables": {
        describe:
          "create tables and indexes on the database if they don't exist",
        type: "boolean",
        default: true,
      },
      "default-cache-ttl": {
        describe: "default TTL for entries cached in memory, in seconds",
        type: "number",
        default: 120,
      },
      "amqp-url": {
        describe: "the RabbitMQ Url",
        type: "string",
      },
      "amqp-tasks-exchange": {
        describe:
          "the name of the exchange for scheduling tasks and receiving results",
        type: "string",
        default: defaultTaskExchange,
      },
      "client-id": {
        describe: "google auth ID",
        type: "string",
      },
      "frontend-domain": {
        describe: "the domain used in templating urls, example: livepeer.org",
        type: "string",
        default: "livepeer.studio",
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
      "ai-gateway-url": {
        describe:
          "base URL of the AI Gateway to call for generative AI requests",
        type: "string",
      },
      "ipfs-gateway-url": {
        describe:
          "base URL to use for the IPFS content gateway returned on assets.",
        type: "string",
        default: "https://ipfs.livepeer.studio/ipfs/",
      },
      "trusted-ipfs-gateways": {
        describe:
          "comma-separated list of regexes for trusted IPFS gateways to automatically convert to IPFS URLs",
        type: "string",
        default: `["https://ipfs.livepeer.studio/ipfs/"]`,
        coerce: coerceRegexList("trusted-ipfs-gateways"),
      },
      "trusted-arweave-gateways": {
        describe:
          "comma-separated list of regexes for trusted Arweave gateways to automatically convert to Arweave URLs",
        type: "string",
        default: JSON.stringify(DEFAULT_ARWEAVE_GATEWAY_PREFIXES),
        coerce: coerceRegexList("trusted-arweave-gateways"),
      },
      "return-region-in-orchestrator": {
        describe: "return /api/region result also in /api/orchestrator",
        type: "boolean",
      },
      "subgraph-url": {
        describe: "URL of subgraph to look for orchestrators",
        type: "string",
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
      "cors-jwt-allowlist": {
        describe:
          "comma-separated list of domains to allow CORS for requests authenticated with a JWT. " +
          "add a / prefix and suffix to an element to have it parsed as a regex",
        type: "string",
        default: `["https://livepeer.studio"]`,
        coerce: coerceRegexList("cors-jwt-allowlist"),
      },
      "jwt-access-token-ttl": {
        describe: "time to live for JWT access tokens, in seconds",
        type: "number",
        default: 60 * 60 * 24, // 1 day
      },
      "jwt-refresh-token-ttl": {
        describe: "time to live for refresh tokens, in seconds",
        type: "number",
        default: 60 * 60 * 24 * 30, // 30 days
      },
      broadcasters: {
        describe:
          "hardcoded list of broadcasters to return from /api/broadcaster.",
        type: "string",
        default: "[]",
        coerce: coerceJsonValue<NodeAddress[]>("broadcasters"),
      },
      orchestrators: {
        describe:
          "hardcoded list of orchestrators to return from /api/orchestrator.",
        type: "string",
        default: "[]",
        coerce: coerceJsonValue<OrchestratorNodeAddress[]>("orchestrators"),
      },
      ingest: {
        describe: "hardcoded list of ingest points to return from /api/ingest.",
        type: "string",
        default: "[]",
        coerce: coerceJsonValue<Ingest[]>("ingest"),
      },
      prices: {
        describe:
          "hardcoded list of prices for broadcasters to return from /api/orchestrator/hook/auth",
        type: "string",
        default: "[]",
        coerce: coerceJsonValue<Price[]>("prices"),
      },
      "support-addr": {
        describe:
          "email address where outgoing emails originate. should be of the form name/email@example.com",
        type: "string",
        default: undefined,
        coerce: (supportAddr: string) => {
          if (!supportAddr) {
            return undefined;
          }
          const split = supportAddr.split("/");
          if (split.length !== 2) {
            throw new Error(
              `supportAddr should be of the form name / email, got ${supportAddr} `,
            );
          }
          return split as [string, string];
        },
      },
      "sendgrid-api-key": {
        describe: "sendgrid api key for sending emails",
        type: "string",
      },
      "sendgrid-validation-api-key": {
        describe: "sendgrid api key for validating email addresses",
        type: "string",
      },
      "sendgrid-template-id": {
        describe: "sendgrid template id to use",
        type: "string",
      },
      "insecure-test-token": {
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
      vodObjectStoreId: {
        describe: "object store ID to use for VOD",
        type: "string",
      },
      vodCatalystObjectStoreId: {
        describe: "object store ID to use for Catalyst VOD",
        type: "string",
      },
      secondaryVodObjectStoreId: {
        describe: "secondary object store ID for Catalyst VOD",
        type: "string",
      },
      vodCatalystPrivateAssetsObjectStoreId: {
        describe: "object store ID to use for private assets in Catalyst VOD",
        type: "string",
      },
      secondaryVodPrivateAssetsObjectStoreId: {
        describe:
          "secondary object store ID to use for private assets in Catalyst VOD",
        type: "string",
      },
      recordCatalystObjectStoreId: {
        describe: "object store ID used by Catalyst to store recordings",
        type: "string",
      },
      secondaryRecordObjectStoreId: {
        describe:
          "secondary object store ID used by Catalyst to store recordings",
        type: "string",
      },
      catalystBaseUrl: {
        describe: "base URL of Catalyst",
        type: "string",
        default: "http://127.0.0.1:7979",
      },
      googleCloudUrlSigningKeyName: {
        describe:
          "name of the signing key to use for signing access cookies for private assets on Google Cloud CDN",
        type: "string",
      },
      googleCloudUrlSigningKey: {
        describe:
          "value of the signing key to use for signing access cookies for private assets on Google Cloud CDN",
        type: "string",
      },
      vodMaxConcurrentTasksPerUser: {
        describe:
          "maximum number of tasks that can be running for a given user",
        default: 5,
        type: "number",
      },
      vodMaxScheduledTasksPerUser: {
        describe:
          "maximum number of tasks that can be in the VOD execution queue for a given user",
        default: 100,
        type: "number",
      },
      aiMaxRequestsPerMinutePerUser: {
        describe:
          "maximum number of AI generate requests that can be made by a user per minute",
        default: 20,
        type: "number",
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
        type: "string",
      },
      "own-region": {
        describe: "identify region in which this server runs (fra, mdw, etc)",
        type: "string",
      },
      consul: {
        describe: "url of the Consul agent",
        type: "string",
      },
      "stripe-secret-key": {
        describe: "Stripe secret key",
        type: "string",
      },
      "stripe-webhook-secret": {
        describe: "Stripe webhook secret",
        type: "string",
      },
      "access-control-admin-pubkey": {
        describe: "Access Control Admin signing public key",
        type: "string",
      },
      "access-control-admin-privkey": {
        describe: "Access Control Admin signing private key",
        type: "string",
      },
      "access-control-default-max-concurrent-viewers": {
        describe: "Access Control Max Concurrent viewers",
        type: "number",
        default: 10_000,
      },
      "verification-frequency": {
        describe: "verificationFreq field to return from stream/hook",
        default: 0,
        type: "number",
      },
      "recaptcha-secret-key": {
        describe: "google recaptcha secret key",
        type: "string",
      },
      "require-email-verification": {
        describe: "require Email Verification",
        default: false,
        type: "boolean",
      },
      "half-region-orchestrators-untrusted": {
        describe:
          "mark half of the orchestrators returned by /api/region as untrusted. For use in staging!",
        default: false,
        type: "boolean",
      },
      json: {
        describe: "print MistController-compatible json description",
        default: false,
        type: "boolean",
        alias: "j",
      },
      did: {
        describe: "Livepeer DID key",
        type: "string",
      },
      livekitHost: {
        describe: "Endpoint for LiveKit server",
        type: "string",
        default: "",
      },
      livekitApiKey: {
        describe: "API key for LiveKit access",
        type: "string",
      },
      livekitSecret: {
        describe: "Secret for LiveKit access",
        type: "string",
      },
      livekitMeetUrl: {
        describe: "Livekit Meet Webapp URL",
        type: "string",
        default: "https://meet.livekit.io/custom",
      },
      saltForRequesterId: {
        describe: "Salt for generating requesterId",
        type: "string",
        default: "",
      },
      frontend: {
        describe: "serve the embedded @livepeer/www Next.js frontend",
        type: "boolean",
        default: true,
      },
      job: {
        describe:
          "run a specific job from start to finish instead of Studio API",
        type: "string",
        choices: JOB_TYPES,
      },
      "job-timeout-sec": {
        describe: "job timeout in seconds",
        type: "number",
        default: 120,
      },
      "active-cleanup-limit": {
        describe: "job/active-cleanup: max number of streams to clean up",
        type: "number",
        default: 1000,
      },
      "projects-cleanup-limit": {
        describe: "job/projects-cleanup: max number of projects to clean up",
        type: "number",
        default: 100,
      },
      "update-usage-from": {
        describe:
          "job/update-usage: unix millis timestamp for start time of update usage job",
        type: "number",
      },
      "update-usage-to": {
        describe:
          "job/update-usage: unix millis timestamp for end time of update usage job",
        type: "number",
      },
      "update-usage-api-token": {
        describe:
          "job/update-usage: Admin API token to be used in the update usage job internal calls",
        type: "string",
      },
      "update-usage-concurrency": {
        describe:
          "job/update-usage: number of concurrent workers to run for updating users usage",
        type: "number",
        default: 10,
      },
      "stream-info-service": {
        describe: "start the Stream Info service instead of Studio API",
        type: "boolean",
      },
      broadcaster: {
        describe:
          "stream-info-service: broadcaster host:port to fetch info from",
        type: "string",
        default: "127.0.0.1:7935",
      },
      "default-stream-profiles": {
        describe: "default stream transcoding profiles if none are provided",
        type: "string",
        default: JSON.stringify([
          {
            name: "240p0",
            fps: 0,
            bitrate: 250000,
            width: 426,
            height: 240,
            profile: "H264ConstrainedHigh",
          },
          {
            name: "360p0",
            fps: 0,
            bitrate: 800000,
            width: 640,
            height: 360,
            profile: "H264ConstrainedHigh",
          },
          {
            name: "480p0",
            fps: 0,
            bitrate: 1600000,
            width: 854,
            height: 480,
            profile: "H264ConstrainedHigh",
          },
          {
            name: "720p0",
            fps: 0,
            bitrate: 3000000,
            width: 1280,
            height: 720,
            profile: "H264ConstrainedHigh",
          },
        ] as FfmpegProfile[]),
        coerce: coerceJsonProfileArr("default-stream-profiles"),
      },
      // this is actually handled raw on ./logger.js but we declare it here so yargs recognizes it
      verbose: {
        describe: "enable verbose logging",
        type: "boolean",
      },
    })
    .usage(
      `
    Livepeer Studio API Node

    Options my also be provided as LP_API_ prefixed environment variables, e.g. LP_API_PORT=5000 is the same as --port=5000.

    --broadcaster and --orchestrator options should be of the form
    [{"address":"https://127.0.0.1:3086","cliAddress":"http://127.0.0.1:3076"}]
    `,
    )
    .strict(
      process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development",
    )
    .env("LP_API_")
    .strict(
      process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "development",
    )
    .help()
    .parse(argv);
  // yargs returns a Promise even tho we don't have any async middlewares
  const parsed = parsedProm as Awaited<typeof parsedProm> & { job?: JobType };
  const mistOutput = yargsToMist(allOptions);
  if (parsed.json === true) {
    console.log(JSON.stringify(mistOutput));
    process.exit(0);
  }

  return parsed as any as CamelKeys<typeof parsed>;
}
