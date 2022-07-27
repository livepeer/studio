import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { Asset, AssetPatchPayload, User } from "../schema/types";
import { db } from "../store";
import { WithID } from "../store/types";
import Table from "../store/table";
import schema from "../schema/schema.json";

// repeat the type here so we don't need to export it from store/asset-table.ts
type DBAsset =
  | WithID<Asset>
  | (Omit<Asset, "status" | "storage"> & {
      id: string;

      // These are deprecated fields from when we had a separate status.storage field.
      status: Asset["status"] & {
        storage: {
          ipfs: {
            taskIds: Asset["storage"]["ipfs"]["status"]["tasks"];
            data?: Asset["storage"]["ipfs"]["status"]["addresses"];
          };
        };
      };
      storage: {
        ipfs: Asset["storage"]["ipfs"]["spec"];
      };
    });

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;
// db.asset migrates the objects on read, gotta go raw
let rawAssetTable: Table<DBAsset>;

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

  rawAssetTable = new Table<DBAsset>({
    db,
    schema: schema.components.schemas["asset"],
  });
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/asset", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;

  beforeEach(async () => {
    await db.objectStore.create({
      id: "mock_vod_store",
      url: "http://user:password@localhost:8080/us-east-1/vod",
    });
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;
  });

  describe("assets status schema migration", () => {
    const mockOldAsset = () =>
      ({
        id: uuid(),
        name: "test2",
        createdAt: Date.now(),
        storage: {
          ipfs: {},
        },
        status: {
          phase: "ready",
          updatedAt: Date.now(),
          storage: { ipfs: { taskIds: { pending: "123" } } },
        },
        userId: nonAdminUser.id,
      } as const);
    const toNewAsset = (old: DBAsset) => {
      const { storage, ...newStatus } = old.status as any;
      return {
        ...old,
        storage: {
          ipfs: {
            spec: {},
            status: {
              phase: "waiting",
              tasks: (old.status as any).storage.ipfs.taskIds,
            },
          },
        },
        status: newStatus,
      } as WithID<Asset>;
    };

    it("should accept and update assets in the new format", async () => {
      let res = await client.post("/asset/request-upload", { name: "zoo" });
      expect(res.status).toBe(200);
      let { asset } = await res.json();
      expect(asset).toMatchObject({ id: expect.any(String) });
      await rawAssetTable.update(asset.id, {
        status: { ...asset.status, phase: "ready" },
      });

      res = await client.patch(`/asset/${asset.id}`, { storage: { ipfs: {} } });
      expect(res.status).toBe(200);
      asset = await res.json();
      expect(asset).toMatchObject({ id: expect.any(String) });
      const expected = {
        storage: {
          ipfs: {
            spec: {},
            status: {
              phase: "waiting",
              tasks: { pending: expect.any(String) },
            },
          },
        },
      };
      expect(asset).toMatchObject(expected);

      const dbAsset = await rawAssetTable.get(asset.id);
      expect(dbAsset).toMatchObject(expected);
    });

    it("should support assets in the old format in database", async () => {
      const asset = await rawAssetTable.create(mockOldAsset());
      const expected = {
        ...toNewAsset(asset),
        downloadUrl: "https://test/asset/video",
      };

      const res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual(expected);
    });

    it("should disallow non-admins from calling migrate API", async () => {
      const res = await client.post("/asset/migrate-status");
      expect(res.status).toBe(403);
    });

    it("should migrate assets to the new format", async () => {
      client.jwtAuth = null;
      client.apiKey = adminApiKey;
      const asset = await rawAssetTable.create(mockOldAsset());
      const expected = toNewAsset(asset);

      expect(rawAssetTable.get(asset.id)).resolves.not.toEqual(expected);

      const res = await client.post("/asset/migrate-status");
      expect(res.status).toBe(200);

      expect(rawAssetTable.get(asset.id)).resolves.toEqual(expected);
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
      expect(body).toMatchObject({
        ...asset,
        name: "zoo",
        status: { ...asset.status, updatedAt: expect.any(Number) },
      });
    });

    it("should start export task when adding IPFS storage", async () => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: { ipfs: { spec: { nftMetadata: { a: "b" } } } },
      });
      expect(res.status).toBe(200);
      const patched = await res.json();
      expect(patched).toMatchObject({
        ...asset,
        storage: {
          ipfs: {
            spec: { nftMetadata: { a: "b" } },
            status: {
              phase: "waiting",
              tasks: { pending: expect.any(String) },
            },
          },
        },
        status: { ...asset.status, updatedAt: expect.any(Number) },
      });

      const taskId = patched.storage.ipfs.status.tasks.pending;
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
          ipfs: {
            spec: { nftMetadata: { a: "b" } },
            status: { tasks: { pending: task.id } },
          },
        },
        status: {
          ...asset.status,
          updatedAt: expect.any(Number),
        },
      });
    });

    it("should update asset status when task finishes", async () => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: { ipfs: {} },
      });
      expect(res.status).toBe(200);
      const patched = await res.json();
      const taskId = patched.storage.ipfs.status.tasks.pending;
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
        storage: {
          ipfs: {
            spec: {},
            status: {
              phase: "ready",
              tasks: { last: taskId },
              addresses: { videoFileCid: "QmX", nftMetadataCid: "QmY" },
            },
          },
        },
        status: { phase: "ready", updatedAt: expect.any(Number) },
      });
    });

    it("should update asset status when task fails", async () => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: { ipfs: {} },
      });
      expect(res.status).toBe(200);
      const patched = await res.json();
      const taskId = patched.storage.ipfs.status.tasks.pending;
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
          message: "oh no it failed!",
          unretriable: true,
        },
        output: null,
      });

      res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual({
        ...patched,
        storage: {
          ipfs: {
            spec: {},
            status: {
              phase: "failed",
              errorMessage: "oh no it failed!",
              tasks: {
                failed: taskId,
              },
            },
          },
        },
        status: { phase: "ready", updatedAt: expect.any(Number) },
      });
    });

    const testStoragePatch = async (
      patchedStorage: AssetPatchPayload["storage"],
      expectedStorage?: Asset["storage"],
      expectedError?: string
    ) => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: patchedStorage,
      });
      const data = await res.json();
      if (!expectedError) {
        // expect(res.status).toBe(200);
        expect(data).toMatchObject({
          ...asset,
          ...(expectedStorage === undefined
            ? {}
            : { storage: expectedStorage }),
          status: expect.any(Object),
        });
      } else {
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(data).toMatchObject({
          errors: [expectedError],
        });
      }
    };

    it("should allow specifying ipfs as a bool", async () => {
      await testStoragePatch({ ipfs: false }, undefined);
      await testStoragePatch(
        { ipfs: true },
        {
          ipfs: {
            spec: {},
            status: expect.any(Object),
          },
        }
      );
      await testStoragePatch(
        { ipfs: false },
        undefined,
        "Cannot remove asset from IPFS"
      );
    });
  });
});
