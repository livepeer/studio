/**
 * This file is imported from all the integration tests. It boots up a server based on the provided argv.
 */
import fs from "fs-extra";

import makeApp, { AppServer } from "./index";
import { rabbitMgmt, startAuxTestServer } from "./test-helpers";
import params, { dbPath, testId } from "./test-params";

let server: AppServer & { host?: string };
let catalystServer;

async function setupServer() {
  await rabbitMgmt.createVhost(testId);

  catalystServer = await startAuxTestServer();
  catalystServer.app.post("/api/events", (req, res) => {
    res.status(200).end();
  });
  params.catalystBaseUrl = `http://127.0.0.1:${catalystServer.port}`;

  server = await makeApp(params);

  server.host = `http://127.0.0.1:${server.port}`;
  return {
    ...params,
    host: server.host,
    store: server.store,
    async close() {
      await server.close();
    },
    db: server.db,
    jobsDb: server.jobsDb,
    queue: server.queue,
    webhook: server.webhook,
    taskScheduler: server.taskScheduler,
  };
}

afterAll(async () => {
  if (server) {
    server.webhook.stop();
    await server.queue.close();
    await server.close();
    server = null;
  }
  if (catalystServer) {
    await catalystServer.close();
  }
  fs.removeSync(dbPath);
  await rabbitMgmt.deleteVhost(testId);
});

export type TestServer = Awaited<ReturnType<typeof setupServer>>;

export default (async () => {
  const serverProm = setupServer();
  await expect(serverProm).resolves.toMatchObject({
    host: expect.any(String),
    store: expect.any(Object),
    db: expect.any(Object),
    queue: expect.any(Object),
  });
  return await serverProm;
})();
