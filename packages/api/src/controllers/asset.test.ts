import serverPromise, { TestServer } from "../test-server";
import {
  TestClient,
  clearDatabase,
  setupUsers,
  createMockFile,
} from "../test-helpers";
import { v4 as uuid } from "uuid";
import { Asset, AssetPatchPayload, Task, User } from "../schema/types";
import { db } from "../store";
import { WithID } from "../store/types";
import Table from "../store/table";
import schema from "../schema/schema.json";
import fs from "fs/promises";
import * as tus from "tus-js-client";
import os from "os";
import { sleep } from "../util";
import { withIpfsUrls } from "./asset";
import { generateUniquePlaybackId } from "./generate-keys";

// repeat the type here so we don't need to export it from store/asset-table.ts
type DBAsset =
  | WithID<Asset>
  | (Omit<Asset, "status" | "storage"> & {
      id: string;

      // These are deprecated fields from when we had a separate status.storage field.
      status: Asset["status"] & {
        storage: {
          ipfs: {
            taskIds: Asset["storage"]["status"]["tasks"];
            data?: Task["output"]["export"]["ipfs"];
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
      url: "s3+http://user:password@localhost:8080/us-east-1/vod",
    });
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;
  });

  describe("assets table", () => {
    it("should create all indexes defined in the schema", async () => {
      const res = await db.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'asset' AND indexname != 'asset_pkey'"
      );
      const indexes = res.rows?.map((r: any) => r.indexname).sort();
      expect(indexes).toEqual([
        "asset_id",
        "asset_playbackId",
        "asset_playbackRecordingId",
        "asset_sourceAssetId",
        "asset_source_url",
        "asset_storage_ipfs_cid",
        "asset_storage_ipfs_nftMetadata_cid",
        "asset_userId",
      ]);
    });
  });

  describe("asset creation", () => {
    it("should import asset and allow updating task progress", async () => {
      const spec = {
        name: "test",
        url: "https://example.com/test.mp4",
      };
      let res = await client.post(`/asset/upload/url`, spec);
      expect(res.status).toBe(200);
      const { asset, task } = await res.json();
      expect(asset).toMatchObject({
        id: expect.any(String),
        name: "test",
        source: {
          type: "url",
          url: spec.url,
        },
        status: { phase: "waiting" },
      });

      const taskId = task.id;
      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "import",
        outputAssetId: asset.id,
        params: {
          import: {
            url: spec.url,
          },
        },
        status: { phase: "waiting" },
      });

      client.jwtAuth = null;
      client.apiKey = adminApiKey;
      res = await client.post(`/task/${taskId}/status`, {
        phase: "running",
        progress: 0.5,
        step: "downloading",
      });
      expect(res.status).toBe(200);

      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        status: { phase: "running", progress: 0.5 },
      });

      res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: asset.id,
        status: { phase: "processing", progress: 0.5 },
      });
    });
  });

  describe("asset inline storage", () => {
    let asset: WithID<Asset>;

    beforeEach(async () => {
      asset = await db.asset.create({
        id: uuid(),
        name: "test-storage",
        source: { type: "directUpload" },
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

    it("should allow editing asset playback policy", async () => {
      let playbackPolicy = {
        type: "public",
      };
      const res = await client.patch(`/asset/${asset.id}`, {
        playbackPolicy,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        ...asset,
        playbackPolicy,
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
          },
          status: {
            phase: "waiting",
            tasks: { pending: expect.any(String) },
          },
        },
        status: { ...asset.status, updatedAt: expect.any(Number) },
      });

      const taskId = patched.storage.status.tasks.pending;
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
          },
          status: { tasks: { pending: task.id } },
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
      const taskId = patched.storage.status.tasks.pending;
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

      const { ipfsGatewayUrl } = server;
      res = await client.get(`/asset/${asset.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual({
        ...patched,
        storage: {
          ipfs: {
            spec: {},
            ...withIpfsUrls(ipfsGatewayUrl, { cid: "QmX" }),
            nftMetadata: withIpfsUrls(ipfsGatewayUrl, { cid: "QmY" }),
            updatedAt: expect.any(Number),
          },
          status: {
            phase: "ready",
            tasks: { last: taskId },
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
      const taskId = patched.storage.status.tasks.pending;
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
          },
          status: {
            phase: "failed",
            errorMessage: "oh no it failed!",
            tasks: {
              failed: taskId,
            },
          },
        },
        status: { phase: "ready", updatedAt: expect.any(Number) },
      });
    });

    const testStoragePatch = async (
      patchedStorage: AssetPatchPayload["storage"],
      expectedStorage?: Asset["storage"],
      expectedErrors?: any[]
    ) => {
      let res = await client.patch(`/asset/${asset.id}`, {
        storage: patchedStorage,
      });
      const data = await res.json();
      if (!expectedErrors) {
        expect(res.status).toBe(200);
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
          errors: expect.arrayContaining(expectedErrors),
        });
      }
      return data;
    };

    it("should allow specifying ipfs as a bool", async () => {
      await testStoragePatch({ ipfs: false }, undefined);
      await testStoragePatch(
        { ipfs: true },
        {
          ipfs: {
            spec: {},
          },
          status: expect.any(Object),
        }
      );
      await testStoragePatch({ ipfs: false }, undefined, [
        "Cannot remove asset from IPFS",
      ]);
    });

    it("should allow specifying ipfs as an empty object", async () => {
      await testStoragePatch(
        { ipfs: { nftMetadata: { a: "b" } } } as any,
        null,
        [expect.stringContaining("should NOT have additional properties")]
      );
      await testStoragePatch(
        { ipfs: {} },
        {
          ipfs: {
            spec: {},
          },
          status: expect.any(Object),
        }
      );
      await testStoragePatch({ ipfs: null }, undefined, [
        "Cannot remove asset from IPFS",
      ]);
      await testStoragePatch({ ipfs: { spec: null } }, undefined, [
        "Cannot remove asset from IPFS",
      ]);
    });

    it("should handle each storage independently", async () => {
      await testStoragePatch({ ipfs: true }, { ipfs: expect.any(Object) });
      await testStoragePatch({}, { ipfs: expect.any(Object) });
      await testStoragePatch({ ipfs: null }, null, [
        "Cannot remove asset from IPFS",
      ]);
    });

    it("should only spawn tasks if spec changes", async () => {
      const patch = {
        ipfs: { spec: { nftMetadata: { a: "b", b: "c" } as any } },
      };
      const expectedStorage: Asset["storage"] = {
        ipfs: {
          spec: patch.ipfs.spec,
        },
        status: {
          phase: "waiting",
          tasks: { pending: expect.any(String) },
        },
      };
      const { storage } = await testStoragePatch(patch, expectedStorage);
      const firstTaskId = storage.status.tasks.pending;
      expectedStorage.status.tasks.pending = firstTaskId;
      await testStoragePatch(patch, expectedStorage);

      await testStoragePatch(
        { ipfs: { spec: { nftMetadata: { b: "c", a: "b" } } } },
        expectedStorage
      );

      patch.ipfs.spec.nftMetadata = { d: "e" };
      expectedStorage.ipfs.spec = patch.ipfs.spec;
      expectedStorage.status.tasks.pending =
        expect.not.stringMatching(firstTaskId);
      await testStoragePatch(patch, expectedStorage);
    });
  });

  describe("asset list", () => {
    let asset: WithID<Asset>;

    beforeEach(async () => {
      await db.asset.create({
        id: uuid(),
        name: "dummy",
        source: { type: "directUpload" },
        createdAt: Date.now(),
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
        userId: nonAdminUser.id,
      });
      const id = uuid();
      asset = await db.asset.create({
        id,
        name: "test-storage",
        createdAt: Date.now(),
        playbackId: await generateUniquePlaybackId(id),
        source: { type: "directUpload" },
        storage: {
          ipfs: {
            spec: {},
            cid: "QmX123",
            nftMetadata: { cid: "QmY321" },
          },
        },
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
        userId: nonAdminUser.id,
      });
    });

    const expectFindAsset = async (qs: string, shouldFind: boolean) => {
      const res = await client.get(`/asset?${qs}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      if (shouldFind) {
        expect(data).toMatchObject([asset]);
      } else {
        expect(data.length).not.toEqual(1); // either empty or more than 1
      }
    };

    it("should find asset by playbackId", async () => {
      await expectFindAsset(`playbackId=somethingelse`, false);
      await expectFindAsset(`playbackId=${asset.playbackId}`, true);
    });

    it("should find asset by CID", async () => {
      await expectFindAsset(`cid=somethingelse`, false);
      await expectFindAsset(`cid=${asset.storage.ipfs.cid}`, true);
    });

    it("should find asset by NFT metadata CID", async () => {
      await expectFindAsset(`nftMetadataCid=somethingelse`, false);
      await expectFindAsset(
        `nftMetadataCid=${asset.storage.ipfs.nftMetadata.cid}`,
        true
      );
    });

    it("should not mix main and NFT metadata CIDs", async () => {
      await expectFindAsset(`cid=${asset.storage.ipfs.nftMetadata.cid}`, false);
      await expectFindAsset(`nftMetadataCid=${asset.storage.ipfs.cid}`, false);
    });

    it("should NOT allow finding by name through direct query string", async () => {
      await expectFindAsset(`name=${asset.name}`, false);
      await expectFindAsset(
        `filters=[{"id":"name","value":"${asset.name}"}]`,
        true
      );
    });
  });

  describe("chunked upload", () => {
    const expectTaskStatus = async (taskId: string, expectedStatus: string) => {
      const res = await client.get(`/task/${taskId}`);
      expect(res.status).toBe(200);
      const task = await res.json();
      expect(task.status.phase).toBe(expectedStatus);
    };

    const uploadFile = async (
      filename: string,
      filePath: string,
      tusEndpoint: string,
      shouldAbort: boolean,
      resumeFrom?: number
    ) => {
      const file = await fs.readFile(filePath);
      const { size } = await fs.stat(filePath);
      let uploadPercentage = await new Promise<number>(
        async (resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: tusEndpoint,
            urlStorage: new (tus as any).FileUrlStorage(
              `${os.tmpdir()}/metadata`
            ),
            chunkSize: 1024 * 1024 * 1,
            metadata: {
              filename,
              filetype: "video/mp4",
            },
            uploadSize: size,
            onError(error) {
              reject(error);
            },
            onProgress(bytesUploaded, bytesTotal) {
              const percentage = parseFloat(
                ((bytesUploaded / bytesTotal) * 100).toFixed(2)
              );
              if (resumeFrom) {
                expect(percentage).toBeGreaterThanOrEqual(resumeFrom);
              }
              if (shouldAbort && percentage > 1) {
                upload.abort().then(() => {
                  resolve(percentage);
                });
              }
            },
            onSuccess() {
              resolve(100);
            },
          });
          if (resumeFrom) {
            const previousUploads = await upload.findPreviousUploads();
            expect(previousUploads).toHaveLength(1);
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        }
      );
      if (shouldAbort) {
        expect(uploadPercentage).toBeGreaterThan(0);
        expect(uploadPercentage).toBeLessThan(100);
      } else {
        expect(uploadPercentage).toBe(100);
      }
      return uploadPercentage;
    };

    it("should start upload, stop it, resume it on tus test server", async () => {
      const filename = "test.mp4";
      const path = os.tmpdir();
      const filePath = `${path}/${filename}`;
      let res = await client.post("/asset/request-upload", {
        name: "tus-test",
      });
      expect(res.status).toBe(200);
      let {
        tusEndpoint,
        task: { id: taskId },
      } = await res.json();
      expect(
        tusEndpoint?.startsWith(`http://test/api/asset/upload/tus?token=`)
      ).toBe(true);
      tusEndpoint = tusEndpoint.replace("http://test", client.server.host);

      await createMockFile(filePath, 1024 * 1024 * 10);
      await expectTaskStatus(taskId, "pending");
      let percentage = await uploadFile(filename, filePath, tusEndpoint, true);
      await expectTaskStatus(taskId, "pending");
      await uploadFile(filename, filePath, tusEndpoint, false, percentage);

      await sleep(100);

      await expectTaskStatus(taskId, "waiting");

      await fs.unlink(filePath);
      await fs.unlink(`${path}/metadata`);
    });
  });
});
