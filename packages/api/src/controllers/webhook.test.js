import serverPromise from "../test-server";
import { TestClient, clearDatabase } from "../test-helpers";

let server;
let mockAdminUser;
let mockNonAdminUser;
let postMockStream;
let mockWebhook;
// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  postMockStream = require("./wowza-hydrate.test-data.json").stream;
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
    name: "test webhook 1",
    kind: "webhook",
    events: ["stream.started"],
    url: "https://winter-darkness-88ea.livepeer.workers.dev/",
    sharedSecret: "keyboardcat",
  };
});

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

describe("controllers/webhook", () => {
  describe("CRUD", () => {
    let client,
      adminUser,
      adminToken,
      nonAdminUser,
      nonAdminToken,
      generatedWebhook,
      generatedWebhookIds;

    beforeAll(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server));
      generatedWebhookIds = [];
    });

    afterAll(async () => {
      await clearDatabase(server);
    });

    it("create a webhook", async () => {
      let res = await client.post("/webhook", { ...mockWebhook });
      let resJson = await res.json();
      expect(res.status).toBe(201);
      generatedWebhook = resJson;
      generatedWebhookIds.push(resJson.id);
      res = await client.post("/webhook", {
        ...mockWebhook,
        name: "test 2",
      });
      resJson = await res.json();
      expect(res.status).toBe(201);
      expect(resJson.name).toBe("test 2");
      generatedWebhookIds.push(resJson.id);

      client.jwtAuth = nonAdminToken["token"];
      res = await client.post("/webhook", {
        ...mockWebhook,
        name: "test non admin",
      });
      resJson = await res.json();
      expect(res.status).toBe(201);
      expect(resJson.name).toBe("test non admin");
      generatedWebhookIds.push(resJson.id);
      client.jwtAuth = adminToken["token"];
    });

    it("supports webhook creation with email", async () => {
      const res = await client.post("/webhook", {
        ...mockWebhook,
        url: undefined,
        email: mockAdminUser.email,
      });
      expect(res.status).toBe(201);
      let resJson = await res.json();
      expect(resJson.email).toBe(mockAdminUser.email);
      generatedWebhookIds.push(resJson.id);
    });

    it("doesn't support webhook creation with bad emails", async () => {
      let res;

      // URL + email
      res = await client.post("/webhook", {
        ...mockWebhook,
        email: mockAdminUser.email,
      });
      expect(res.status).toBe(422);

      // email that doesn't match account
      res = await client.post("/webhook", {
        ...mockWebhook,
        email: "user@example.com",
      });
      expect(res.status).toBe(422);

      // no url or email
      res = await client.post("/webhook", {
        ...mockWebhook,
        url: undefined,
      });
      expect(res.status).toBe(422);
    });

    it("supports creation with legacy event field", async () => {
      const res = await client.post("/webhook", {
        ...mockWebhook,
        event: mockWebhook.events[0],
        events: undefined,
      });
      expect(res.status).toBe(201);
      const resJson = await res.json();
      expect(resJson).toMatchObject(mockWebhook);
      generatedWebhookIds.push(resJson.id);

      const fromGet = await client
        .get(`/webhook/${resJson.id}`)
        .then((r) => r.json());
      expect(fromGet).toMatchObject(mockWebhook);

      const fromDb = await server.db.webhook.get(resJson.id);
      expect(fromDb).toMatchObject(mockWebhook);
    });

    it("get webhook info", async () => {
      const res = await client.get(`/webhook/${generatedWebhook.id}`);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson.id).toEqual(generatedWebhook.id);
      expect(resJson.userId).toEqual(generatedWebhook.userId);
    });

    it("get webhooks list", async () => {
      const res = await client.get(`/webhook?limit=1`);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(res.headers.get("link")).toEqual(
        expect.stringContaining("cursor=")
      );
      expect(resJson).toHaveLength(1);
      expect(resJson[0].userId).toEqual(generatedWebhook.userId);
      expect(generatedWebhookIds).toContain(resJson[0].id);
    });

    it("get webhooks list all", async () => {
      const res = await client.get(`/webhook?allUsers=1`);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson).toHaveLength(generatedWebhookIds.length);
      expect(resJson.map((wh) => wh.name)).toContain("test non admin");
    });

    it("update a webhook", async () => {
      const { id } = generatedWebhook;
      const modifiedHook = { ...generatedWebhook, name: "modified_name" };
      const res = await client.put(`/webhook/${id}`, modifiedHook);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson.id).toEqual(id);

      const updated = await client.get(`/webhook/${id}`).then((r) => r.json());
      expect(updated.userId).toEqual(adminUser.id);
      expect(updated.name).toEqual("modified_name");
    });

    it("disallows setting webhook for another user", async () => {
      const { id } = generatedWebhook;
      const modifiedHook = { ...generatedWebhook, userId: nonAdminUser.id };

      const res = await client.put(`/webhook/${id}`, modifiedHook);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson.id).toEqual(id);

      const updated = await client.get(`/webhook/${id}`).then((r) => r.json());
      expect(updated.userId).toEqual(adminUser.id);
    });

    it("delete a webhook", async () => {
      const res = await client.delete(`/webhook/${generatedWebhook.id}`);
      expect(res.status).toBe(204);

      client.jwtAuth = nonAdminToken.token;
      const res2 = await client.get(`/webhook/${generatedWebhook.id}`);
      const resJson2 = await res2.json();

      expect(res2.status).toBe(404);
    });

    it("delete multiple webhooks", async () => {
      let ids = [];
      for (let i = 0; i < 5; i++) {
        const res = await client.post("/webhook", mockWebhook);
        expect(res.status).toBe(201);
        ids.push(await res.json().then((json) => json.id));
      }
      let res = await client.delete(`/webhook`, { ids });
      expect(res.status).toBe(204);

      res = await client.delete(`/webhook`, { ids });
      expect(res.status).toBe(404);

      for (const id of ids) {
        res = await client.get(`/webhook/${ids[2]}`);
        expect(res.status).toBe(404);
        res = await client.delete(`/webhook`, {
          ids: [generatedWebhookIds[2], id],
        });
        const json = await res.json();
        expect(res.status).toBe(404);
      }
    });
  });

  describe("webhook trigger", () => {
    let client,
      adminUser,
      adminToken,
      nonAdminUser,
      nonAdminToken,
      generatedWebhook;

    beforeAll(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server));
    });

    afterAll(async () => {
      await clearDatabase(server);
    });

    it("trigger webhook", async () => {
      // create webhook
      const webhookRes = await client.post("/webhook", { ...mockWebhook });
      let webhookResJson = await webhookRes.json();
      expect(webhookRes.status).toBe(201);
      generatedWebhook = webhookResJson;

      const webhookRes2 = await client.post("/webhook", { ...mockWebhook });
      let webhookResJson2 = await webhookRes2.json();
      expect(webhookRes2.status).toBe(201);
      // generatedWebhook = webhookResJson

      // create a stream object
      const now = Date.now();
      postMockStream.name = "eli_is_cool"; // :D
      const res = await client.post("/stream", { ...postMockStream });
      expect(res.status).toBe(201);
      const stream = await res.json();
      expect(stream.id).toBeDefined();
      expect(stream.kind).toBe("stream");
      expect(stream.name).toBe("eli_is_cool");
      expect(stream.createdAt).toBeGreaterThanOrEqual(now);
      const document = await server.store.get(`stream/${stream.id}`);
      expect(server.db.stream.addDefaultFields(document)).toEqual(stream);

      // trigger
      const setActiveRes = await client.put(`/stream/${stream.id}/setactive`, {
        active: true,
      });
      expect(setActiveRes).toBeDefined();
      expect(setActiveRes.status).toBe(204);
      // const setActiveResJson = await setActiveRes.json()
      // expect(setActiveResJson).toBeDefined()
    }, 20000);

    it("trigger webhook with localIP", async () => {
      await clearDatabase(server);
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server));

      let localWebhook = { ...mockWebhook };
      localWebhook.url = "192.168.1.1";
      // create webhook
      const webhookRes = await client.post("/webhook", { ...localWebhook });
      let webhookResJson = await webhookRes.json();
      expect(webhookRes.status).toBe(422);
    });
  });
});
