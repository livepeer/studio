import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { PushTarget, User } from "../schema/types";
import { db } from "../store";

// includes auth file tests

let server: TestServer;
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
    let adminUser: User;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminToken: string;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
    });

    it("should not get all push targets without admin authorization", async () => {
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
      expect(await res.json()).toEqual([{ ...userPushTarget, url: undefined }]);
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

    it("should get all push targets with admin authorization", async () => {
      client.jwtAuth = adminToken;

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
        const match = part.match(/cursor=([^&>]+)[^>]*>;\s+rel="next"/);
        if (!match) continue;
        return match[1];
      }
      return null;
    };

    it("should support pagination", async () => {
      const createdIds: string[] = [];
      for (let i = 0; i < 13; i += 1) {
        const created = await db.pushTarget.fillAndCreate({
          ...mockPushTargetInput,
          userId: nonAdminUser.id,
        });
        createdIds.push(created.id);
      }

      const listedIDs: string[] = [];
      let cursor = "";
      for (let page = 1; page <= 3; page++) {
        const res = await client.get(
          `/push-target?userId=${nonAdminUser.id}&limit=5&cursor=${cursor}`
        );
        expect(res.status).toBe(200);

        const link = res.headers.get("link");
        expect(link).toEqual(
          page < 3 ? expect.stringContaining("cursor=") : null
        );
        cursor = getNextCursor(link);

        const pageItems = (await res.json()) as PushTarget[];
        expect(pageItems.length).toBe(page < 3 ? 5 : 3);
        pageItems.forEach((pt) => expect(pt.url).toBeUndefined());
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

    it("should patch a push target", async () => {
      let res = await client.post("/push-target", mockPushTargetInput);
      expect(res.status).toBe(201);
      const created = (await res.json()) as PushTarget;

      res = await client.patch(`/push-target/${created.id}`, {
        disabled: "not a bool",
      });
      expect(res.status).toBe(422);

      res = await client.patch(`/push-target/${created.id}`, {
        disabled: true,
      });
      expect(res.status).toBe(204);
      const patched = db.pushTarget.cleanWriteOnlyResponse(
        await db.pushTarget.get(created.id)
      );
      expect(patched).not.toEqual(created);
      expect(patched).toEqual({ ...created, disabled: true });
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

    it("should use a default name with the URL host", async () => {
      let res = await client.post("/push-target", {
        ...mockPushTargetInput,
        name: undefined,
      });
      expect(res.status).toBe(201);
      const created = await res.json();
      expect(created.name).toEqual("live.zoo.tv");
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

    it("should not allow non-admin users to access another user's push targets", async () => {
      const created = await db.pushTarget.fillAndCreate({
        ...mockPushTargetInput,
        userId: adminUser.id,
      });

      let res = await client.get(`/push-target/${created.id}`);
      expect(res.status).toBe(404);

      res = await client.get(`/push-target?userId=${created.userId}`);
      expect(res.status).toBe(403);

      client.jwtAuth = adminToken;
      res = await client.get(`/push-target/${created.id}`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(created);
    });
  });

  describe("API key authorization", () => {
    let client: TestClient;
    let adminUser: User;
    let adminApiKey: string;
    let nonAdminUser: User;
    let nonAdminApiKey: string;

    beforeEach(async () => {
      ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminApiKey } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      // set a default invalid api key on the client
      client.apiKey = uuid();
    });

    it("should not get all push targets with non-admin API key", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get(`/push-target?userId=${adminUser.id}`);
      expect(res.status).toBe(403);

      res = await client.get(`/push-target`);
      expect(res.status).toBe(400);
    });

    it("should get all push targets for another user with admin API key", async () => {
      client.apiKey = adminApiKey;
      let res = await client.get(`/push-target?userId=${nonAdminUser.id}`);
      expect(res.status).toBe(200);

      res = await client.get(`/push-target`);
      expect(res.status).toBe(200);
    });

    it("should throw forbidden error when using invalid API key", async () => {
      client.apiKey = "random_key";
      const res = await client.get(`/push-target?userId=${nonAdminUser.id}`);
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

      const res = await client.get(`/push-target?userId=${nonAdminUser.id}`);
      expect(res.status).toBe(500);
      const errJson = await res.json();
      expect(errJson.errors[0]).toEqual(
        `no user found for token Bearer ${tokenId}`
      );
    });
  });
});
