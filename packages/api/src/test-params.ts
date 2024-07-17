import fs from "fs-extra";
import os from "os";
import path from "path";
import { v4 as uuid } from "uuid";

import argParser from "./parse-cli";

export const testId = `test_${Date.now()}`;
export const dbPath = path.resolve(os.tmpdir(), "livepeer", uuid());

const clientId = "EXPECTED_AUDIENCE";
const trustedDomain = "livepeer.org";
const jwtAudience = "livepeer";
const jwtSecret = "secret";
// enable to test SendGrid integration
const supportAddr: [string, string] = ["Livepeer Team", "angie@livepeer.org"];
const sendgridTemplateId = "iamanid";
const sendgridApiKey = "SG. iamanapikey";

fs.ensureDirSync(dbPath);

const params = argParser();
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
params.postgresUrl = `postgresql://postgres@127.0.0.1/${testId}`;
params.recordObjectStoreId = "mock_store";
params.recordCatalystObjectStoreId = "mock_store";
params.vodObjectStoreId = "mock_vod_store";
params.trustedIpfsGateways = [
  "https://ipfs.example.com/ipfs/",
  /https:\/\/.+\.ipfs-provider.io\/ipfs\//,
];
params.aiGatewayUrl = "http://localhost:30303/";
params.ingest = [
  {
    ingest: "rtmp://test/live",
    playback: "https://test/hls",
    playbackDirect: "https://test/hls",
    base: "https://test",
    baseDirect: "https://test",
    origin: "http://test",
  },
];
params.amqpUrl = `amqp://127.0.0.1:5672/${testId}`;
if (!params.insecureTestToken) {
  params.insecureTestToken = uuid();
}
params.listen = true;
params.requireEmailVerification = true;
params.livekitHost = "livekit";
params.frontend = false;

console.log(`test run parameters: ${JSON.stringify(params)}`);

export default params;
