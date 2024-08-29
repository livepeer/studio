import fetch from "node-fetch";
import { v4 as uuid } from "uuid";

import { sign } from "../controllers/helpers";
import { USER_SESSION_TIMEOUT } from "../controllers/stream";
import { ApiToken, ObjectStore, Stream, User, Webhook } from "../schema/types";
import { db } from "../store";
import { DBSession } from "../store/session-table";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
import {
  AuxTestServer,
  TestClient,
  clearDatabase,
  startAuxTestServer,
} from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";
import { semaphore, sleep } from "../util";

const bodyParser = require("body-parser");
jest.setTimeout(15000);

describe("webhook cannon", () => {
  let server: TestServer;
  let webhookServer: AuxTestServer;
  let testHost;

  let mockAdminUser: User;
  let mockNonAdminUser: User;
  let postMockStream: Stream;
  let mockStore: WithID<ObjectStore>;
  let mockWebhook: Webhook;
  let client,
    adminUser,
    adminToken,
    nonAdminUser,
    nonAdminToken,
    adminProject,
    nonAdminProject;

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
    const adminProject = await db.project.create({
      name: "admin test project",
      id: uuid(),
      userId: adminUser.id,
    });

    const resNonAdmin = await client.post(`/user/`, { ...mockNonAdminUser });
    let nonAdminUser = await resNonAdmin.json();

    tokenRes = await client.post(`/user/token`, { ...mockNonAdminUser });
    const nonAdminToken = await tokenRes.json();

    const nonAdminUserRes = await server.store.get(
      `user/${nonAdminUser.id}`,
      false,
    );
    nonAdminUser = { ...nonAdminUserRes, emailValid: true };
    await server.store.replace(nonAdminUser);
    const nonAdminProject = await db.project.create({
      name: "non-admin test project",
      id: uuid(),
      userId: nonAdminUser.id,
    });
    return {
      client,
      adminUser,
      adminToken,
      nonAdminUser,
      nonAdminToken,
      adminProject,
      nonAdminProject,
    };
  }

  beforeAll(async () => {
    // await clearDatabase();

    try {
      server = await serverPromise;
      console.log("postgres NAME", server.postgresUrl);
    } catch (error) {
      console.log("caught server error ", error);
      throw error;
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
      url: "http://127.0.0.1:30000/webhook",
      sharedSecret: "keyboardCat",
    };

    webhookServer = await startAuxTestServer(30000);
    testHost = `http://127.0.0.1:${webhookServer.port}`;

    mockStore = {
      id: "mock_store",
      url: `s3+http://localhost:${webhookServer.port}/bucket-name`,
      publicUrl: `http://localhost:${webhookServer.port}/bucket-name`,
      userId: mockAdminUser.id,
    };
  });

  afterAll(async () => {
    await webhookServer.close();
  });

  beforeEach(async () => {
    ({
      client,
      adminUser,
      adminToken,
      nonAdminUser,
      nonAdminToken,
      adminProject,
      nonAdminProject,
    } = await setupUsers(server));

    await db.objectStore.create(mockStore);
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
    let webhook2Callback: (body: any) => void;

    beforeAll(() => {
      webhookServer.app.use(bodyParser.json());
      webhookServer.app.use((req, res, next) => {
        if (req.path.startsWith("/webhook")) {
          const signatureHeader = String(req.headers["livepeer-signature"]);
          const signature: string = signatureHeader.split(",")[1].split("=")[1];
          expect(signature).toEqual(
            sign(JSON.stringify(req.body), mockWebhook.sharedSecret),
          );
        }
        next();
      });
      webhookServer.app.post("/webhook", (req, res) => {
        webhookCallback(req.body);
        res.status(204).end();
      });
      webhookServer.app.post("/webhook2", (req, res) => {
        webhook2Callback(req.body);
        res.status(204).end();
      });
    });

    beforeEach(async () => {
      webhookCallback = webhook2Callback = () => {};

      await server.store.create({
        id: "streamid",
        playbackId: "manifestId",
        userId: nonAdminUser.id,
        kind: "stream",
      });
      client.jwtAuth = nonAdminToken["token"];
    });

    it("should be able to receive the webhook event", async () => {
      const res = await client.post(
        "/webhook?projectId=" + nonAdminProject.id,
        {
          ...mockWebhook,
          name: "test non admin",
        },
      );
      const resJson = await res.json();
      console.log("webhook body: ", resJson);
      expect(res.status).toBe(201);
      expect(resJson.name).toBe("test non admin");
      expect(resJson.projectId).toBe(nonAdminProject.id);

      const sem = semaphore();
      let called = false;
      webhookCallback = () => {
        called = true;
        sem.release();
      };

      await server.queue.publishWebhook("events.stream.started", {
        type: "webhook_event",
        id: "webhook_test_12",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.started",
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await sem.wait(3000);
      expect(called).toBe(true);
    });

    it("should not receive webhook for different project", async () => {
      const res = await client.post(
        "/webhook?projectId=" + nonAdminProject.id,
        {
          ...mockWebhook,
          name: "test non admin",
        },
      );
      const resJson = await res.json();
      console.log("webhook body: ", resJson);
      expect(res.status).toBe(201);

      const sem = semaphore();
      let called = false;
      webhookCallback = () => {
        called = true;
        sem.release();
      };

      const differentProject = await db.project.create({
        name: "different project",
        id: uuid(),
        userId: nonAdminUser.id,
      });

      await server.queue.publishWebhook("events.stream.started", {
        type: "webhook_event",
        id: "webhook_test_12",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.started",
        userId: nonAdminUser.id,
        projectId: differentProject.id,
      });

      await sem.wait(3000);
      expect(called).toBe(false);
    });

    describe("local webhook", () => {
      beforeAll(() => {
        server.webhook.skipUrlVerification = false;
      });

      afterAll(() => {
        server.webhook.skipUrlVerification = true;
      });

      it("should not call local webhooks", async () => {
        // we create the same mock webhook, but given url verification is enabled it should not be called
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

        await server.queue.publishWebhook("events.stream.started", {
          type: "webhook_event",
          id: "webhook_test_12",
          timestamp: Date.now(),
          streamId: "streamid",
          event: "stream.started",
          userId: nonAdminUser.id,
          projectId: nonAdminProject.id,
        });

        await sem.wait(3000);
        expect(called).toBe(false);
      });
    });

    it("should call multiple webhooks", async () => {
      let res = await client.post(`/webhook?projectId=${nonAdminProject.id}`, {
        ...mockWebhook,
        name: "test-1",
      });
      expect(res.status).toBe(201);
      res = await client.post(`/webhook?projectId=${nonAdminProject.id}`, {
        ...mockWebhook,
        url: mockWebhook.url + "2",
        name: "test-2",
      });
      expect(res.status).toBe(201);

      const sems = [semaphore(), semaphore()];
      let calledFlags = [false, false];
      webhookCallback = () => {
        calledFlags[0] = true;
        sems[0].release();
      };
      webhook2Callback = () => {
        calledFlags[1] = true;
        sems[1].release();
      };

      await server.queue.publishWebhook("events.stream.started", {
        type: "webhook_event",
        id: "webhook_test_12",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.started",
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await Promise.all(sems.map((s) => s.wait(3000)));
      expect(calledFlags).toEqual([true, true]);
    });

    it("should receive events for related project and not for unrelated", async () => {
      let res = await client.post(`/webhook?projectId=${nonAdminProject.id}`, {
        ...mockWebhook,
        name: "test-related",
      });
      expect(res.status).toBe(201);

      const differentProject = await db.project.create({
        name: "different project",
        id: uuid(),
        userId: nonAdminUser.id,
      });

      res = await client.post(`/webhook?projectId=${differentProject.id}`, {
        ...mockWebhook,
        name: "test-unrelated",
      });

      expect(res.status).toBe(201);

      const sems = [semaphore(), semaphore()];
      let calledFlags = [false, false];
      webhookCallback = () => {
        calledFlags[0] = true;
        sems[0].release();
      };
      webhook2Callback = () => {
        calledFlags[1] = true;
        sems[1].release();
      };

      await server.queue.publishWebhook("events.stream.started", {
        type: "webhook_event",
        id: "webhook_test_12",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.started",
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await Promise.all(sems.map((s) => s.wait(3000)));
      expect(calledFlags).toEqual([true, false]);
    });

    it("should send multiple events to same webhook", async () => {
      const res = await client.post(
        `/webhook?projectId=${nonAdminProject.id}`,
        {
          ...mockWebhook,
          name: "test-multi",
          events: ["stream.started", "stream.idle"],
        },
      );
      expect(res.status).toBe(201);

      let callCount = 0;
      let receivedEvent: string;
      let sem = semaphore();
      webhookCallback = (body) => {
        receivedEvent = body.event;
        callCount++;
        sem.release();
      };

      await server.queue.publishWebhook("events.stream.started", {
        type: "webhook_event",
        id: "webhook_test_12",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.started",
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await sem.wait(3000);
      expect(callCount).toBe(1);
      expect(receivedEvent).toBe("stream.started");

      sem = semaphore();
      await server.queue.publishWebhook("events.stream.idle", {
        type: "webhook_event",
        id: "webhook_test_42",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.idle",
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await sem.wait(3000);
      expect(callCount).toBe(2);
      expect(receivedEvent).toBe("stream.idle");

      // does not receive some random event
      sem = semaphore();
      await server.queue.publishWebhook("events.stream.unknown" as any, {
        type: "webhook_event",
        id: "webhook_test_93",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.unknown" as any,
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await sem.wait(1000);
      expect(callCount).toBe(2);
    });

    it("should retry webhook deliveries (independently)", async () => {
      let res = await client.post(`/webhook?projectId=${nonAdminProject.id}`, {
        ...mockWebhook,
        name: "test-retries-1",
      });
      expect(res.status).toBe(201);
      res = await client.post(`/webhook?projectId=${nonAdminProject.id}`, {
        ...mockWebhook,
        url: mockWebhook.url + "2",
        name: "test-retries-2",
      });
      expect(res.status).toBe(201);

      const sems = [semaphore(), semaphore()];
      let calledCounts = [0, 0];
      webhookCallback = () => {
        const attempt = ++calledCounts[0];
        if (attempt < 4) throw new Error("backoff! im busy 😡");
        sems[0].release();
      };
      webhook2Callback = () => {
        const attempt = ++calledCounts[1];
        if (attempt < 2) throw new Error("could you please try later? 😇");
        sems[1].release();
      };
      server.webhook.calcBackoff = () => 100;

      await server.queue.publishWebhook("events.stream.started", {
        type: "webhook_event",
        id: "webhook_test_12",
        timestamp: Date.now(),
        streamId: "streamid",
        event: "stream.started",
        userId: nonAdminUser.id,
        projectId: nonAdminProject.id,
      });

      await Promise.all(sems.map((s) => s.wait(3000)));
      expect(calledCounts).toEqual([4, 2]);
    });

    describe("recording.waiting handling", () => {
      let parentStream: DBStream;
      let childStream: DBStream;
      let session: DBSession;

      beforeEach(async () => {
        // create parent stream
        let res = await client.post(`/stream?projectId=${nonAdminProject.id}`, {
          ...postMockStream,
          record: true,
          recordingSpec: {
            profiles: [
              {
                name: "720p",
                bitrate: 2000000,
                fps: 30,
                width: 1280,
                height: 720,
              },
            ],
          },
        });
        expect(res.status).toBe(201);
        parentStream = await res.json();

        // create child stream and session
        const sessionId = uuid();
        res = await client.post(
          `/stream/${parentStream.id}/stream?projectId=${nonAdminProject.id}&sessionId=${sessionId}`,
          {
            name: "session1",
          },
        );
        expect(res.status).toBe(201);
        childStream = await res.json();
        expect(childStream).toMatchObject({
          sessionId,
          parentId: parentStream.id,
          isActive: true,
        });

        session = await db.session.get(sessionId);
        expect(session).toMatchObject({ id: sessionId });

        const lastSeen = Date.now() - 2 * USER_SESSION_TIMEOUT;
        await db.stream.update(childStream.id, { lastSeen });
        await db.session.update(session.id, {
          lastSeen,
          sourceSegments: 1,
        });

        webhookServer.app.all("/bucket-name/*", (req, res) => {
          console.log("req.url", req.url);
          res.end("a good file");
        });
      });

      it("should create asset from recording.waiting event", async () => {
        const res = await client.post(
          `/webhook?projectId=${nonAdminProject.id}`,
          {
            ...mockWebhook,
            name: "test-recording-waiting",
            events: ["recording.waiting"],
          },
        );
        expect(res.status).toBe(201);
        const webhook = await res.json();
        expect(webhook.userId).toEqual(nonAdminUser.id);

        const sem = semaphore();
        let called = false;
        webhookCallback = () => {
          called = true;
          sem.release();
        };

        await server.queue.publishWebhook("events.recording.waiting", {
          type: "webhook_event",
          id: "webhook_test_12",
          timestamp: Date.now(),
          streamId: parentStream.id,
          sessionId: session.id,
          event: "recording.waiting",
          userId: nonAdminUser.id,
          projectId: nonAdminProject.id,
        });

        await sem.wait(3000);
        expect(called).toBe(true);

        const asset = await db.asset.get(session.id);
        expect(asset).toMatchObject({
          id: session.id,
          userId: nonAdminUser.id,
          source: {
            type: "recording",
            sessionId: session.id,
          },
          status: {
            phase: "waiting",
          },
        });
      });

      it("should propagate recording spec to upload task", async () => {
        const res = await client.post(
          `/webhook?projectId=${nonAdminProject.id}`,
          {
            ...mockWebhook,
            name: "test-recording-waiting",
            events: ["recording.waiting"],
          },
        );
        expect(res.status).toBe(201);
        const webhook = await res.json();
        expect(webhook.userId).toEqual(nonAdminUser.id);

        const sem = semaphore();
        let called = false;
        webhookCallback = () => {
          called = true;
          sem.release();
        };

        await server.queue.publishWebhook("events.recording.waiting", {
          type: "webhook_event",
          id: "webhook_test_12",
          timestamp: Date.now(),
          streamId: parentStream.id,
          sessionId: session.id,
          event: "recording.waiting",
          userId: nonAdminUser.id,
          projectId: nonAdminProject.id,
        });

        await sem.wait(3000);
        expect(called).toBe(true);

        const [tasks] = await db.task.find({ outputAssetId: session.id });
        expect(tasks).toHaveLength(1);
        expect(tasks[0].params?.upload).toMatchObject({
          profiles: parentStream.recordingSpec.profiles,
        });
      });
    });
  });

  describe("local IP check", () => {
    beforeAll(() => {
      server.webhook.skipUrlVerification = false;
    });

    afterAll(() => {
      server.webhook.skipUrlVerification = true;
    });

    const expectIsLocal = async (
      url: string,
      isLocal: boolean,
      ips?: string[],
    ) => {
      expect(await server.webhook.checkIsLocalIp(url, false)).toMatchObject({
        isLocal,
        ips,
      });
    };

    it("should flag local IPs", async () => {
      await expectIsLocal("http://127.0.0.1/test", true, ["127.0.0.1"]);
      await expectIsLocal("http://[::1]/test", true, ["::1"]);
    });

    it("should flag private IPs", async () => {
      await expectIsLocal("http://10.42.0.1/test", true, ["10.42.0.1"]);
      await expectIsLocal("http://172.16.3.4/test", true, ["172.16.3.4"]);
      await expectIsLocal("http://[fd12:3456:789a:1::1]/test", true, [
        "fd12:3456:789a:1::1",
      ]);
    });

    it("should flag loopback addresses", async () => {
      await expectIsLocal("http://localhost:1234/test", true, ["127.0.0.1"]);
      await expectIsLocal("http://ip6-localhost:1234/test", true, ["::1"]);
      await expectIsLocal("http://ip6-loopback:1234/test", true, ["::1"]);
    });

    it("should not flag public IPs", async () => {
      await expectIsLocal("http://172.67.149.35/test", false, [
        "172.67.149.35",
      ]);
      await expectIsLocal("http://[2606:4700:3037::ac43:9523]/test", false, [
        "2606:4700:3037::ac43:9523",
      ]);
    });

    describe("domain resolution", () => {
      let prevResolver;
      let resolverMock: ReturnType<typeof createResolverMock>;

      const createResolverMock = () => ({
        resolve4: jest.fn<Promise<string[]>, any, any>(),
        resolve6: jest.fn<Promise<string[]>, any, any>(),
      });

      beforeEach(() => {
        prevResolver = server.webhook.resolver;
        server.webhook.resolver = resolverMock = createResolverMock() as any;
      });

      afterEach(() => {
        server.webhook.resolver = prevResolver;
      });

      it("should not flag domains that resolve to public IPs", async () => {
        resolverMock.resolve4.mockReturnValueOnce(
          Promise.resolve(["172.67.149.35"]),
        );
        resolverMock.resolve6.mockReturnValueOnce(
          Promise.resolve(["2606:4700:3037::ac43:9523"]),
        );

        await expectIsLocal("http://livepeer.studio/mock", false, [
          "172.67.149.35",
          "2606:4700:3037::ac43:9523",
        ]);
        expect(resolverMock.resolve4.mock.calls).toHaveLength(1);
        expect(resolverMock.resolve4.mock.calls[0][0]).toEqual(
          "livepeer.studio",
        );
        expect(resolverMock.resolve6.mock.calls).toHaveLength(1);
        expect(resolverMock.resolve6.mock.calls[0][0]).toEqual(
          "livepeer.studio",
        );
      });

      const privateTestCases = [
        { name: "IPv4-only", ipv4: ["10.42.0.10"], ipv6: [] },
        { name: "IPv6-only", ipv4: [], ipv6: ["::1"] },
        { name: "IPv4 and IPv6", ipv4: ["172.0.0.1"], ipv6: ["::1"] },
        {
          name: "mixed private and public IPs",
          ipv4: ["172.67.149.35", "172.16.34.123"],
          ipv6: ["2606:4700:3037::ac43:9523", "fd12:3456:789a:1::1"],
        },
      ];

      for (const { name, ipv4, ipv6 } of privateTestCases) {
        it(`should flag domains that resolve to private IPs (${name})`, async () => {
          resolverMock.resolve4.mockReturnValueOnce(Promise.resolve(ipv4));
          resolverMock.resolve6.mockReturnValueOnce(Promise.resolve(ipv6));

          await expectIsLocal("http://local.mydomain.com/test", true, [
            ...ipv4,
            ...ipv6,
          ]);
          expect(resolverMock.resolve4.mock.calls).toHaveLength(1);
          expect(resolverMock.resolve4.mock.calls[0][0]).toEqual(
            "local.mydomain.com",
          );
          expect(resolverMock.resolve6.mock.calls).toHaveLength(1);
          expect(resolverMock.resolve6.mock.calls[0][0]).toEqual(
            "local.mydomain.com",
          );
        });
      }
    });
  });
});
