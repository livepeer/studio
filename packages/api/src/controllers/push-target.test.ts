import serverPromise from "../test-server";
import { TestClient, clearDatabase } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { PushTarget, User } from "../schema/types";
import Model from "../store/model";
import { db } from "../store";

// includes auth file tests

let server: { store: Model };
let mockPushTargetInput: PushTarget;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  mockPushTargetInput = {
    url: "rtmps://live.zoo.tv/cage/s5d72b3j42o",
    name: "zoo-stream",
  };

  mockAdminUserInput = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUserInput = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/push-target", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client: TestClient;
    let nonAdminToken: string;
    let nonAdminUser: User;
    let adminUser: User;

    beforeEach(async () => {
      client = new TestClient({
        server,
      });
      // setting up admin user and token
      const userRes = await client.post(`/user`, { ...mockAdminUserInput });
      adminUser = await userRes.json();

      const adminTokenRes = await client.post(`/user/token`, {
        ...mockAdminUserInput,
      });
      const adminToken = await adminTokenRes.json();
      client.jwtAuth = adminToken.token;

      const user = await server.store.get(`user/${adminUser.id}`, false);
      adminUser = { ...user, admin: true, emailValid: true };
      await server.store.replace(adminUser);

      // setting up non-admin user
      const nonAdminRes = await client.post(`/user`, {
        ...mockNonAdminUserInput,
      });
      nonAdminUser = await nonAdminRes.json();
      const tokenRes = await client.post(`/user/token`, {
        ...mockNonAdminUserInput,
      });
      const tokenJson = await tokenRes.json();
      nonAdminToken = tokenJson.token;

      const nonAdminUserRes = await server.store.get(
        `user/${nonAdminUser.id}`,
        false
      );
      nonAdminUser = { ...nonAdminUserRes, emailValid: true };
      await server.store.replace(nonAdminUser);
    });

    it("should not get all push targets without admin authorization", async () => {
      client.jwtAuth = nonAdminToken;
      const input = {
        ...mockPushTargetInput,
        userId: nonAdminUser.id,
      };
      const userPushTarget = await db.pushTarget.fillAndCreate(input);

      for (let i = 0; i < 10; i += 1) {
        const input = {
          ...mockPushTargetInput,
          userId: uuid(),
        };
        const created = await db.pushTarget.fillAndCreate(input);

        const res = await client.get(`/push-target/${created.id}`);
        expect(res.status).toBe(404);
      }
      const res = await client.get(`/push-target?userId=${nonAdminUser.id}`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([userPushTarget]);
    });

    it("should throw 403 error if JWT is not verified", async () => {
      client.jwtAuth = "random_value";
      const input = {
        ...mockPushTargetInput,
        userId: uuid(),
      };
      const created = await db.pushTarget.fillAndCreate(input);

      const res = await client.get(`/push-target/${created.id}`);
      expect(res.status).toBe(403);
      const resJson = await res.json();
      expect(resJson.errors[0]).toBe("jwt malformed");
    });

    it("should get all object stores with admin authorization", async () => {
      const allTargets = [];
      for (let i = 0; i < 10; i += 1) {
        const input = {
          ...mockPushTargetInput,
          userId: uuid(),
        };
        const created = await db.pushTarget.fillAndCreate(input);

        const res = await client.get(`/push-target/${created.id}`);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(created);
        allTargets.push({ ...created, user: {} });
      }

      const res = await client.get(`/push-target`);
      expect(res.status).toBe(200);
      const listed: PushTarget[] = await res.json();
      listed.sort((a, b) => a.createdAt - b.createdAt);
      expect(listed).toEqual(allTargets);
    });

    const getNextCursor = (link: string | null): string => {
      link ??= "";
      for (const part of link.split(",")) {
        if (!/cursor=.*>;\s+rel="next"/.test(part)) {
          continue;
        }
        return /cursor=([^&>]+)/.exec(part)[1];
      }
      return null;
    };

    it("should support pagination", async () => {
      const createdIds: string[] = [];
      for (let i = 0; i < 13; i += 1) {
        const created = await db.pushTarget.fillAndCreate({
          ...mockPushTargetInput,
          userId: adminUser.id,
        });
        createdIds.push(created.id);
      }

      const listedIDs: string[] = [];
      let cursor = "";
      for (let page = 1; page <= 3; page++) {
        const res = await client.get(
          `/push-target?userId=${adminUser.id}&limit=5&cursor=${cursor}`
        );
        expect(res.status).toBe(200);

        const link = res.headers.get("link");
        expect(link).toEqual(
          page < 3 ? expect.stringContaining("cursor=") : null
        );
        cursor = getNextCursor(link);

        const pageItems = (await res.json()) as PushTarget[];
        expect(pageItems.length).toBe(page < 3 ? 5 : 3);
        listedIDs.push(...pageItems.map((t) => t.id));
      }
      expect(listedIDs.length).toEqual(13);
      createdIds.forEach(expect(listedIDs).toContain);
    });

    it("should return a 404 if pushTarget not found", async () => {
      const id = uuid();
      const resp = await client.get(`/push-target/${id}`);
      expect(resp.status).toBe(404);
    });

    it("should create a push target", async () => {
      // we only clean write fields from non-admin users
      client.jwtAuth = nonAdminToken;

      const preCreationTime = Date.now();
      let res = await client.post("/push-target", mockPushTargetInput);
      expect(res.status).toBe(201);
      const created = (await res.json()) as PushTarget;
      expect(created.id).toBeDefined();
      expect(created.url).toBeUndefined();
      expect(created.name).toEqual(mockPushTargetInput.name);
      expect(created.createdAt).toBeGreaterThanOrEqual(preCreationTime);

      res = await client.get(`/push-target/${created.id}`);
      expect(res.status).toBe(200);
      const getResponse = await res.json();
      expect(getResponse).toEqual(created);
    });

    it("should support RTMP, RTMPS and SRT for URL", async () => {
      const baseUrl = mockPushTargetInput.url.split("://")[1];
      let res = await client.post("/push-target", {
        ...mockPushTargetInput,
        url: `rtmp://${baseUrl}`,
      });
      expect(res.status).toBe(201);
      res = await client.post("/push-target", {
        ...mockPushTargetInput,
        url: `rtmps://${baseUrl}`,
      });
      expect(res.status).toBe(201);
      res = await client.post("/push-target", {
        ...mockPushTargetInput,
        url: `srt://${baseUrl}`,
      });
      expect(res.status).toBe(201);
    });

    describe("should not accept invalid payloads for creating a push target", () => {
      const testJsonError = async (expectErr: string, payload?: any) => {
        const res = await client.post("/push-target", payload);
        expect(res.status).toBe(422);

        const body = await res.json();
        const error = JSON.parse(body.errors[0]);
        expect(error.keyword).toEqual(expectErr);
      };

      test("no payload", async () => {
        await testJsonError("required");
      });
      test("missing property", async () => {
        await testJsonError("required", {
          ...mockPushTargetInput,
          url: undefined,
        });
      });
      test("additional properties", async () => {
        await testJsonError("additionalProperties", {
          ...mockPushTargetInput,
          unknownField: "hello",
        });
      });
      test("wrong field type", async () => {
        await testJsonError("type", {
          ...mockPushTargetInput,
          url: true,
        });
        await testJsonError("type", {
          ...mockPushTargetInput,
          createdAt: "right now",
        });
        await testJsonError("type", {
          ...mockPushTargetInput,
          name: ["what", "if"],
        });
      });
      test("bad field format", async () => {
        await testJsonError("pattern", {
          ...mockPushTargetInput,
          url: "is this a uri?",
        });
        await testJsonError("pattern", {
          ...mockPushTargetInput,
          url: "https://webrtc.stream.it/handshake",
        });
        await testJsonError("format", {
          ...mockPushTargetInput,
          url: "rtmp://this started really well but",
        });
      });
      test("bad url", async () => {
        const res = await client.post("/push-target", {
          ...mockPushTargetInput,
          url: "rtmps://!@#$%^&*()_+",
        });
        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.errors[0]).toContain("Bad URL");
      });
    });

    it("should not get another users object store with non-admin user", async () => {
      client.jwtAuth = nonAdminToken.token;

      const storeChangeId = JSON.parse(JSON.stringify(store));
      storeChangeId.userId = adminUser.id;
      storeChangeId.id = uuid();
      await server.store.create(storeChangeId);

      let res = await client.get(`/object-store/${storeChangeId.id}`);
      expect(res.status).toBe(403);

      res = await client.get(`/object-store?userId=${adminUser.id}`);
      expect(res.status).toBe(403);
    });
  });

  describe("object stores endpoint with api key", () => {
    let client;
    let adminUser;
    let nonAdminUser;
    const adminApiKey = uuid();
    const nonAdminApiKey = uuid();

    beforeEach(async () => {
      client = new TestClient({
        server,
        apiKey: uuid(),
      });

      const userRes = await client.post(`/user/`, { ...mockAdminUser });
      adminUser = await userRes.json();

      const nonAdminRes = await client.post(`/user/`, { ...mockNonAdminUser });
      nonAdminUser = await nonAdminRes.json();

      await server.store.create({
        id: adminApiKey,
        kind: "api-token",
        userId: adminUser.id,
      });

      await server.store.create({
        id: nonAdminApiKey,
        kind: "api-token",
        userId: nonAdminUser.id,
      });

      const user = await server.store.get(`user/${adminUser.id}`, false);
      adminUser = { ...user, admin: true, emailValid: true };
      await server.store.replace(adminUser);

      const nonAdminUserRes = await server.store.get(
        `user/${nonAdminUser.id}`,
        false
      );
      nonAdminUser = { ...nonAdminUserRes, emailValid: true };
      await server.store.replace(nonAdminUser);
    });

    it("should not get all object stores with nonadmin token", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get(`/object-store?userId=${adminUser.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(403);
    });

    it("should get all object stores for another user with admin token and apiKey", async () => {
      client.apiKey = adminApiKey;
      const res = await client.get(`/object-store?userId=${nonAdminUser.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(200);
    });

    it("should throw forbidden error when using random api Key", async () => {
      client.apiKey = "random_key";
      const res = await client.get(`/object-store?userId=${nonAdminUser.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(403);
    });

    it("should throw 500 internal server error if user does not exist", async () => {
      // create token with no user
      const tokenId = uuid();
      await server.store.create({
        id: tokenId,
        kind: "api-token",
        userId: uuid(),
      });
      client.apiKey = tokenId;

      const res = await client.get(`/object-store/${adminUser.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(500);
      expect(objStore.errors[0]).toBe(
        `no user found for token Bearer ${tokenId}`
      );
    });
  });
});
