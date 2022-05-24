import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { Asset, MultistreamTarget, User } from "../schema/types";
import { db } from "../store";

// includes auth file tests

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;

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

describe("controllers/asset", () => {
  describe("assets status schema migration", () => {
    let client: TestClient;
    let adminUser: User;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminToken: string;

    beforeEach(async () => {
      await db.objectStore.create({
        id: "mock_vod_store",
        url: "http://user:password@localhost:8080/us-east-1/vod",
      });
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
    });

    it("should create assets in the new format", async () => {
      const res = await client.post("/asset/request-upload", { name: "zoo" });
      expect(res.status).toBe(200);
      const { asset } = await res.json();
      const expected = {
        id: expect.any(String),
        name: "zoo",
        status: { phase: "waiting", updatedAt: expect.any(Number) },
      };
      expect(asset).toMatchObject(expected);
      const dbAsset = await db.asset.get(asset.id);
      expect(dbAsset).toMatchObject(expected);
    });

    it("should support assets in the old format in database", async () => {
      const asset: any = await db.asset.create({
        id: uuid(),
        name: "test2",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "ready",
        userId: nonAdminUser.id,
      } as any);
      const res = await client.get("/asset/" + asset.id);
      expect(res.status).toBe(200);
      const assetRes = await res.json();

      const { updatedAt, ...expected } = asset;
      expect(assetRes).toMatchObject({
        ...expected,
        status: { phase: "ready", updatedAt: asset.updatedAt },
      });
    });
  });
});
