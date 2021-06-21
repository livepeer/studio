/**
 * This file is imported from all the integration tests. It boots up a server based on the provided argv.
 */

import argParser from "./parse-cli";
import makeApp from "./index";
import fs from "fs-extra";
import uuid from "uuid/v4";
import path from "path";
import os from "os";
import fetch from "isomorphic-fetch";

const dbPath = path.resolve(os.tmpdir(), "livepeer", uuid());
const clientId = "EXPECTED_AUDIENCE";
const trustedDomain = "livepeer.org";
const jwtAudience = "livepeer";
const jwtSecret = "secret";
// enable to test SendGrid integration
const supportAddr = "Livepeer Team/angie@livepeer.org";
const sendgridTemplateId = "iamanid";
const sendgridApiKey = "SG. iamanapikey";

fs.ensureDirSync(dbPath);

const params = argParser();
// Secret code used for back-door DB access in test env

// Some overrides... we want to run on a random port for parallel reasons
delete params.port;
params.dbPath = dbPath;
params.clientId = clientId;
params.trustedDomain = trustedDomain;
params.jwtAudience = jwtAudience;
params.jwtSecret = jwtSecret;
params.supportAddr = supportAddr;
params.sendgridTemplateId = sendgridTemplateId;
params.sendgridApiKey = sendgridApiKey;
params.postgresUrl = `postgresql://postgres@127.0.0.1/test_${Date.now()}`;
params.recordObjectStoreId = "mock_store";
params.ingest =
  '[{"ingest": "rtmp://test/live","playback": "https://test/hls","base": "https://test"}]';
params.amqpUrl = "amqp://localhost:5672/livepeer";
if (!params.insecureTestToken) {
  params.insecureTestToken = uuid();
}
params.listen = true;
let server;

console.log(`test run parameters: ${JSON.stringify(params)}`);

async function setupServer() {
  if (params.storage === "firestore") {
    server = {
      ...params,
      host: "https://livepeer-test.livepeer.workers.dev",
      close: () => {},
    };
  } else {
    server = await makeApp(params);
    server.host = `http://127.0.0.1:${server.port}`;
  }
  // Make an RPC call to the server to have it do this store thing
  const doStore = (action) => async (...args) => {
    args = args.map((x) => (x === undefined ? "UNDEFINED" : x));
    // console.log(`client: ${action} ${JSON.stringify(args)}`)
    const result = await fetch(`${server.host}/${params.insecureTestToken}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ action, args }),
    });
    if (result.status === 204) {
      return null;
    }
    if (result.status !== 200) {
      const text = await result.text();
      const errorArgs = args.map((x) => JSON.stringify(x)).join(", ");
      const err: Error & { status?: number } = new Error(
        `error while attempting req.store.${action}(${errorArgs}): ${result.status} ${text}`
      );
      err.status = result.status;
      throw err;
    }
    return await result.json();
  };
  return {
    ...params,
    host: server.host,
    store: server.store,
    async close() {
      await server.close();
    },
    db: server.db,
    queue: server.queue,
  };
}

afterAll(async () => {
  if (server) {
    await server.close();
  }
  fs.removeSync(dbPath);
});

type UnboxPromise<T> = T extends Promise<infer U> ? U : T;

export type TestServer = UnboxPromise<ReturnType<typeof setupServer>> &
  Record<string, unknown>; // necessary for kebab=>camel case properties
export default Promise.resolve().then(setupServer);
