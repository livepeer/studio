import fetch from "node-fetch";
import serverPromise, { TestServer } from "../test-server";
import {
  TestClient,
  clearDatabase,
  startAuxTestServer,
  AuxTestServer,
} from "../test-helpers";
import { semaphore, sleep } from "../util";
import { sign } from "../controllers/helpers";

const bodyParser = require("body-parser");
jest.setTimeout(15000);

describe("webhook cannon", () => {
  let server: TestServer;
  let webhookServer: AuxTestServer;
  let testHost;

  let mockAdminUser;
  let mockNonAdminUser;
  let postMockStream;
  let mockWebhook;
  let client, adminUser, adminToken, nonAdminUser, nonAdminToken;

  async function setupUsers(server) {
    const client = new TestClient({
      server,
    });
    // setting up admin user and token
    const userRes = await client.post(`/user/`, { ...mockAdminUser });
    let adminUser = await userRes.json();

    let tokenRes = await client.post(`/user/token`, { ...mockAdminUser });
    const adminToken = await tokenRes.json();
    client.jwtAuth = adminToken["token"];

    const user = await server.store.get(`user/${adminUser.id}`, false);
    adminUser = { ...user, admin: true, emailValid: true };
    await server.store.replace(adminUser);

    const resNonAdmin = await client.post(`/user/`, { ...mockNonAdminUser });
    let nonAdminUser = await resNonAdmin.json();

    tokenRes = await client.post(`/user/token`, { ...mockNonAdminUser });
    const nonAdminToken = await tokenRes.json();

    const nonAdminUserRes = await server.store.get(
      `user/${nonAdminUser.id}`,
      false
    );
    nonAdminUser = { ...nonAdminUserRes, emailValid: true };
    await server.store.replace(nonAdminUser);
    return { client, adminUser, adminToken, nonAdminUser, nonAdminToken };
  }

  beforeAll(async () => {
    // await clearDatabase();

    try {
      server = await serverPromise;
      console.log("postgres NAME", server.postgresUrl);
    } catch (error) {
      console.log("caught server error ", error);
    }
    postMockStream =
      require("../controllers/wowza-hydrate.test-data.json").stream;
    delete postMockStream.id;
    delete postMockStream.kind;
    postMockStream.presets = ["P360p30fps16x9", "P144p30fps16x9"];
    postMockStream.renditions = {
      bbb_360p:
        "/stream/305b9fa7-c6b3-4690-8b2e-5652a2556524/P360p30fps16x9.m3u8",
      thesource_bbb: "/stream/305b9fa7-c6b3-4690-8b2e-5652a2556524/source.m3u8",
      random_prefix_bbb_160p:
        "/stream/305b9fa7-c6b3-4690-8b2e-5652a2556524/P144p30fps16x9.m3u8",
    };
    postMockStream.wowza.streamNameGroups = [
      {
        name: "bbb_all",
        renditions: ["thesource_bbb", "bbb_360p", "random_prefix_bbb_160p"],
      },
      {
        name: "bbb_mobile",
        renditions: ["random_prefix_bbb_160p"],
      },
    ];

    mockAdminUser = {
      email: "user_admin@gmail.com",
      password: "x".repeat(64),
    };

    mockNonAdminUser = {
      email: "user_non_admin@gmail.com",
      password: "y".repeat(64),
    };

    mockWebhook = {
      id: "mock_webhook",
      name: "test webhook 1",
      kind: "webhook",
      createdAt: Date.now(),
      events: ["stream.started"],
      url: "http://localhost:30000/webhook",
      sharedSecret: "keyboardCat",
    };

    webhookServer = await startAuxTestServer(30000);
    testHost = `http://localhost:${webhookServer.port}`;
    console.log("beforeALL done");
  });

  afterAll(async () => {
    await webhookServer.close();
  });

  beforeEach(async () => {
    ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
      await setupUsers(server));
  });

  afterEach(async () => {
    // need to wait until cannon writes webhook responses to db
    await sleep(200);
    await clearDatabase(server);
  });

  it("should have a test server", async () => {
    // webhookServer.use(bodyParser);
    webhookServer.app.get("/self-test", (req, res) => {
      res.end("self test was good");
    });
    const res = await fetch(`${testHost}/self-test`);
    const text = await res.text();
    expect(text).toEqual("self test was good");
  });

  it("should be able to create webhooks", async () => {
    // create the webhook
    let res = await client.post("/webhook", { ...mockWebhook });
    let resJson = await res.json();
    console.log("webhook body: ", resJson);
    expect(res.status).toBe(201);
    res = await client.post("/webhook", {
      ...mockWebhook,
      name: "test 2",
    });
    resJson = await res.json();
    console.log("webhook body: ", resJson);
    expect(res.status).toBe(201);
    expect(resJson.name).toBe("test 2");
  });

  describe("receiving events", () => {
    let webhookCallback: (body: any) => void;

    beforeAll(() => {
      webhookServer.app.use(bodyParser.json());
      webhookServer.app.post("/webhook", (req, res) => {
        console.log("WEBHOOK WORKS , body", req.body);
        const signatureHeader = String(req.headers["livepeer-signature"]);
        const signature: string = signatureHeader.split(",")[1].split("=")[1];
        expect(signature).toEqual(
          sign(JSON.stringify(req.body), mockWebhook.sharedSecret)
        );
        webhookCallback(req.body);
        res.status(204).end();
      });
    });

    beforeEach(async () => {
      webhookCallback = () => {};

      await server.store.create({
        id: "streamid",
        userId: nonAdminUser.id,
        kind: "stream",
      });
      client.jwtAuth = nonAdminToken["token"];
    });

    it("should be able to receive the webhook event", async () => {
      const res = await client.post("/webhook", {
        ...mockWebhook,
        name: "test non admin",
      });
      const resJson = await res.json();
      console.log("webhook body: ", resJson);
      expect(res.status).toBe(201);
      expect(resJson.name).toBe("test non admin");

      const sem = semaphore();
      let called = false;
      webhookCallback = () => {
        called = true;
        sem.release();
      };

      await server.queue.publish("events.stream",{
        id: "webhook_test_12",
        time: Date.now(),
        channel: "test.channel",
        event: "stream.started",
        streamId: "streamid",
        userId: nonAdminUser.id,
        isConsumed: false,
      });

      await sem.wait(3000);
      expect(called).toBe(true);
    });

    it("should call multiple webhooks", async () => {
      let res = await client.post("/webhook", {
        ...mockWebhook,
        name: "test-1",
      });
      expect(res.status).toBe(201);
      res = await client.post("/webhook", {
        ...mockWebhook,
        name: "test-2",
      });
      expect(res.status).toBe(201);

      const sem = semaphore();
      let callCount = 0;
      webhookCallback = () => {
        callCount++;
        if (callCount === 2) sem.release();
      };

      await server.queue.publish("events.stream",{
        id: "webhook_test_12",
        time: Date.now(),
        channel: "test.channel",
        event: "stream.started",
        streamId: "streamid",
        userId: nonAdminUser.id,
        isConsumed: false,
      });

      await sem.wait(3000);
      expect(callCount).toBe(2);
    });

    it("should send multiple events to same webhook", async () => {
      const res = await client.post("/webhook", {
        ...mockWebhook,
        name: "test-multi",
        events: ["stream.started", "stream.idle"],
      });
      expect(res.status).toBe(201);

      let callCount = 0;
      let receivedEvent: string;
      let sem = semaphore();
      webhookCallback = (body) => {
        receivedEvent = body.event;
        callCount++;
        sem.release();
      };

      await server.queue.publish("events.stream",{
        id: "webhook_test_12",
        time: Date.now(),
        channel: "test.channel",
        event: "stream.started",
        streamId: "streamid",
        userId: nonAdminUser.id,
        isConsumed: false,
      });

      await sem.wait(3000);
      expect(callCount).toBe(1);
      expect(receivedEvent).toBe("stream.started");

      sem = semaphore();
      await server.queue.publish("events.stream",{
        id: "webhook_test_42",
        time: Date.now(),
        channel: "test.channel",
        event: "stream.idle",
        streamId: "streamid",
        userId: nonAdminUser.id,
        isConsumed: false,
      });

      await sem.wait(3000);
      expect(callCount).toBe(2);
      expect(receivedEvent).toBe("stream.idle");

      // does not receive some random event
      sem = semaphore();
      await server.queue.publish("events.stream",{
        id: "webhook_test_93",
        time: Date.now(),
        channel: "test.channel",
        event: "stream.unknown",
        streamId: "streamid",
        userId: nonAdminUser.id,
        isConsumed: false,
      });

      await sem.wait(1000);
      expect(callCount).toBe(2);
    });
  });
});
