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
    name: "live.zoo.tv",
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
      const storeChangeId = JSON.parse(JSON.stringify(store));
      storeChangeId.id = uuid();
      await server.store.create(storeChangeId);

      let res = await client.get(`/object-store/${store.id}`);
      const objStore = await res.json();
      expect(res.status).toBe(403);
      expect(objStore.errors[0]).toBe("jwt malformed");
    });

    it("should get all object stores with admin authorization", async () => {
      store.userId = adminUser.id;
      for (let i = 0; i < 4; i += 1) {
        const storeChangeId = JSON.parse(JSON.stringify(store));
        storeChangeId.id = uuid();
        await server.store.create(storeChangeId);
        const res = await client.get(`/object-store/${storeChangeId.id}`);
        expect(res.status).toBe(200);
        const objStore = await res.json();
        expect(objStore.id).toEqual(storeChangeId.id);
      }

      const res = await client.get(`/object-store?userId=${adminUser.id}`);
      expect(res.status).toBe(200);
      const objStores = await res.json();
      expect(objStores.length).toEqual(4);

      // making sure url is coming back as null
      expect(objStores[0].url).toEqual(null);
    });

    it("should get some of the object stores & get a working next Link", async () => {
      store.userId = adminUser.id;
      for (let i = 0; i < 13; i += 1) {
        const storeChangeId = JSON.parse(JSON.stringify(store));
        storeChangeId.id = uuid();
        await server.store.create(storeChangeId);
        const res = await client.get(`/object-store/${storeChangeId.id}`);
        expect(res.status).toBe(200);
        const objStore = await res.json();
        expect(objStore.id).toEqual(storeChangeId.id);
      }

      const res = await client.get(
        `/object-store?userId=${store.userId}&limit=11`
      );
      const objStores = await res.json();
      expect(res.headers._headers.link).toBeDefined();
      expect(res.headers._headers.link.length).toBe(1);
      expect(objStores.length).toEqual(11);
    });

    it("should create an object store", async () => {
      postMockStore.userId = adminUser.id;
      postMockStore.name = "test name";
      const now = Date.now();
      let res = await client.post("/object-store", { ...postMockStore });
      expect(res.status).toBe(201);
      const objStore = await res.json();
      expect(objStore.id).toBeDefined();
      expect(objStore.url).toEqual(undefined);
      expect(objStore.name).toEqual("test name");
      expect(objStore.createdAt).toBeGreaterThanOrEqual(now);

      const resp = await client.get(`/object-store/${objStore.id}`);
      expect(resp.status).toBe(200);
      const objStoreGet = await resp.json();
      expect(objStore.url).toEqual(undefined);
      expect(objStore.userId).toBe(objStoreGet.userId);

      // if same request is made, should return a 201
      res = await client.post("/object-store", { ...postMockStore });
      expect(res.status).toBe(201);
    });

    it("should return a 404 if objectStore not found", async () => {
      const id = uuid();
      const resp = await client.get(`/object-store/${adminUser.id}/${id}`);
      expect(resp.status).toBe(404);
    });

    it("should not accept an empty body for creating an object store", async () => {
      const res = await client.post("/object-store");
      expect(res.status).toBe(422);
    });

    it("should not accept missing property for creating an object store", async () => {
      const postMockStoreMissingProp = JSON.parse(
        JSON.stringify(postMockStore)
      );
      delete postMockStoreMissingProp["url"];
      const res = await client.post("/object-store", {
        ...postMockStoreMissingProp,
      });
      expect(res.status).toBe(422);
      expect(res.statusText).toBe("Unprocessable Entity");
    });

    it("should not accept additional properties for creating an object store", async () => {
      const postMockStoreExtraField = JSON.parse(JSON.stringify(postMockStore));
      postMockStoreExtraField.extraField = "extra field";
      const res = await client.post("/object-store", {
        ...postMockStoreExtraField,
      });
      expect(res.status).toBe(422);
      expect(res.statusText).toBe("Unprocessable Entity");
    });

    it("should not accept wrong type of field for creating an object store", async () => {
      const postMockStoreWrongType = JSON.parse(JSON.stringify(postMockStore));
      postMockStoreWrongType.url = 123;
      const res = await client.post("/object-store", {
        ...postMockStoreWrongType,
      });
      expect(res.status).toBe(422);
      expect(res.statusText).toBe("Unprocessable Entity");
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
