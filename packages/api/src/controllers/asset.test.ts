import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { Asset, MultistreamTarget, User } from "../schema/types";
import { db } from "../store";
import { WithID } from "../store/types";
import { ConsumeMessage } from "amqplib";

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

  describe("assets status schema migration", () => {
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
      const res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      const assetRes = await res.json();

      const { updatedAt, ...expected } = asset;
      expect(assetRes).toMatchObject({
        ...expected,
        status: { phase: "ready", updatedAt: asset.updatedAt },
      });
    });
  });

  describe("asset inline storage", () => {
    let asset: WithID<Asset>;

    beforeEach(async () => {
      asset = await db.asset.create({
        id: uuid(),
        name: "test-storage",
        createdAt: Date.now(),
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
        userId: nonAdminUser.id,
      });
    });

    it("should allow editing asset name", async () => {
      const res = await client.patch(`/asset/${asset.id}`, { name: "zoo" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ ...asset, name: "zoo" });
    });

    it("should start export task when adding IPFS storage", async () => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: { ipfs: { nftMetadata: { a: "b" } } },
      });
      expect(res.status).toBe(200);
      const patched = await res.json();
      expect(patched).toMatchObject({
        ...asset,
        storage: { ipfs: { nftMetadata: { a: "b" } } },
        status: {
          ...asset.status,
          updatedAt: expect.any(Number),
          storage: {
            ipfs: {
              taskIds: {
                pending: expect.any(String),
              },
            },
          },
        },
      });

      const taskId = patched.status.storage.ipfs.taskIds.pending;
      res = await client.get("/task/" + taskId);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "export",
        inputAssetId: asset.id,
        params: {
          export: {
            ipfs: {
              nftMetadata: { a: "b" },
            },
          },
        },
      });
    });

    it("should update asset storage when manually exporting to IPFS", async () => {
      let res = await client.post(`/asset/${asset.id}/export`, {
        ipfs: { nftMetadata: { a: "b" } },
      });
      expect(res.status).toBe(201);
      const { task } = await res.json();
      expect(task).toMatchObject({
        id: expect.any(String),
        type: "export",
        inputAssetId: asset.id,
      });

      res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        ...asset,
        storage: {
          ipfs: { nftMetadata: { a: "b" } },
        },
        status: {
          ...asset.status,
          updatedAt: expect.any(Number),
          storage: {
            ipfs: {
              taskIds: {
                pending: task.id,
              },
            },
          },
        },
      });
    });

    it("should update asset status when task finishes", async () => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: { ipfs: {} },
      });
      expect(res.status).toBe(200);
      const patched = await res.json();
      const taskId = patched.status.storage.ipfs.taskIds.pending;
      await server.taskScheduler.processTaskEvent({
        id: uuid(),
        type: "task_result",
        timestamp: Date.now(),
        task: {
          id: taskId,
          type: "export",
          snapshot: await db.task.get(taskId),
        },
        error: null,
        output: {
          export: {
            ipfs: {
              videoFileCid: "QmX",
              nftMetadataCid: "QmY",
            },
          },
        },
      });

      res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual({
        ...patched,
        status: {
          phase: "ready",
          updatedAt: expect.any(Number),
          storage: {
            ipfs: {
              taskIds: {
                last: taskId,
              },
              data: {
                videoFileCid: "QmX",
                nftMetadataCid: "QmY",
              },
            },
          },
        },
      });
    });

    it("should update asset status when task fails", async () => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: { ipfs: {} },
      });
      expect(res.status).toBe(200);
      const patched = await res.json();
      const taskId = patched.status.storage.ipfs.taskIds.pending;
      await server.taskScheduler.processTaskEvent({
        id: uuid(),
        type: "task_result",
        timestamp: Date.now(),
        task: {
          id: taskId,
          type: "export",
          snapshot: await db.task.get(taskId),
        },
        error: {
          message: "failed!",
          unretriable: true,
        },
        output: null,
      });

      res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual({
        ...patched,
        status: {
          phase: "ready",
          updatedAt: expect.any(Number),
          storage: {
            ipfs: {
              taskIds: {
                failed: taskId,
              },
            },
          },
        },
      });
    });
  });
});
