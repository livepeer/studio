import serverPromise, { TestServer } from "../test-server";
import {
  TestClient,
  clearDatabase,
  setupUsers,
  createMockFile,
} from "../test-helpers";
import { v4 as uuid } from "uuid";
import {
  ApiToken,
  Asset,
  AssetPatchPayload,
  Task,
  User,
} from "../schema/types";
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

  const createProject = async () => {
    let res = await client.post(`/project`);
    expect(res.status).toBe(201);
    const projectObj = await res.json();
    expect(projectObj).toMatchObject({
      id: expect.any(String),
    });
    return projectObj.id;
  };

  const allowedOrigins = [
    "http://localhost:3000",
    "https://staging.wetube.com",
    "http://blockflix.io:69",
  ];

  const createApiToken = async (
    cors: ApiToken["access"]["cors"],
    projectId: string
  ) => {
    client.jwtAuth = nonAdminToken;
    let res = await client.post(`/api-token/?projectId=${projectId}`, {
      name: "test",
      access: { cors },
    });
    client.jwtAuth = null;
    expect(res.status).toBe(201);
    const apiKeyObj = await res.json();
    expect(apiKeyObj).toMatchObject({
      id: expect.any(String),
      access: { cors },
    });
    return apiKeyObj.id;
  };

  beforeEach(async () => {
    await db.objectStore.create({
      id: "mock_vod_store",
      url: "s3+http://user:password@localhost:8080/us-east-1/vod",
      publicUrl: "http://localhost/bucket/vod",
    });
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;
  });

  describe("asset creation", () => {
    it("should import asset and allow updating task progress", async () => {
      const spec = {
        name: "test",
        url: "https://example.com/test.mp4",
      };
      let res = await client.post(`/asset/upload/url`, spec);
      expect(res.status).toBe(201);
      const { asset, task } = await res.json();
      expect(asset).toMatchObject({
        id: expect.any(String),
        name: "test",
        source: {
          type: "url",
          url: spec.url,
        },
        projectId: expect.any(String), //should have a default project id
        status: { phase: "waiting" },
      });

      const taskId = task.id;
      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "upload",
        outputAssetId: asset.id,
        params: {
          upload: {
            url: spec.url,
          },
        },
        status: { phase: "waiting" },
      });

      client.jwtAuth = null;
      client.apiKey = adminApiKey;

      res = await client.post(`/task/${taskId}/status`, {
        status: {
          phase: "running",
          progress: 0.5,
          step: "downloading",
        },
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

  it("should import asset (using jwt) for existing project (created with jwt) and list with filters", async () => {
    const spec = {
      name: "test",
      url: "https://example.com/test.mp4",
    };
    const projectId = await createProject();

    let res = await client.post(
      `/asset/upload/url/?projectId=${projectId}`,
      spec
    );
    expect(res.status).toBe(201);
    const { asset, task } = await res.json();
    expect(asset).toMatchObject({
      id: expect.any(String),
      name: "test",
      source: {
        type: "url",
        url: spec.url,
      },
      projectId: `${projectId}`,
      status: { phase: "waiting" },
    });

    client.jwtAuth = null;
    client.apiKey = adminApiKey;

    res = await client.get(`/project/${projectId}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toBeDefined(); //api-key be retrieve if adminApiKey is used..

    res = await client.get(
      `/asset?limit=10&allUsers=true&filters=[{"id":"playbackId","value":"${asset.playbackId}"}]`
    );
    expect(res.status).toBe(200);
    let assets = await res.json();
    expect(assets).toHaveLength(1);
    expect(assets[0].projectId).toBe(projectId);
    expect(assets[0].playbackId).toBe(asset.playbackId);
  });

  it("should import asset (using api-token) for existing project (created with jwt)", async () => {
    const spec = {
      name: "test",
      url: "https://example.com/test.mp4",
    };
    const projectId = await createProject();

    client.jwtAuth = null;
    client.apiKey = await createApiToken({ allowedOrigins }, projectId);

    let res = await client.post(`/asset/upload/url/`, spec);
    expect(res.status).toBe(201);
    const { asset, task } = await res.json();
    expect(asset).toMatchObject({
      id: expect.any(String),
      name: "test",
      source: {
        type: "url",
        url: spec.url,
      },
      projectId: `${projectId}`,
      status: { phase: "waiting" },
    });

    client.apiKey = adminApiKey;
    res = await client.get(`/project/${projectId}`);
    const project = await res.json();
    expect(res.status).toBe(200);
    expect(project.id).toBeDefined();
  });

  it("should import asset when projectId is not passed and list with projectId", async () => {
    const spec = {
      name: "test",
      url: "https://example.com/test.mp4",
    };
    let res = await client.post(`/asset/upload/url`, spec);
    expect(res.status).toBe(201);
    const { asset, task } = await res.json();

    client.jwtAuth = null;
    client.apiKey = adminApiKey;

    res = await client.get(`/asset?limit=10&allUsers=true`);
    expect(res.status).toBe(200);
    let assets = await res.json();
    expect(assets).toHaveLength(1);
    expect(assets[0].projectId).toBe(asset.projectId);
  });

  it("should NOT import asset (using api-key) when projectId passed as ouery-param", async () => {
    const spec = {
      name: "test",
      url: "https://example.com/test.mp4",
    };

    client.jwtAuth = null;
    client.apiKey = adminApiKey;

    const projectId = await createProject();

    // BadRequest is expected if projectId is passed in as query-param
    let res = await client.post(
      `/asset/upload/url/?projectId=${projectId}`,
      spec
    );
    expect(res.status).toBe(400);

    // Let's try again without query-param
    res = await client.post(`/asset/upload/url/`, spec);
    const { asset, task } = await res.json();
    expect(asset).toMatchObject({
      id: expect.any(String),
      name: "test",
      source: {
        type: "url",
        url: spec.url,
      },
      projectId: adminUser.defaultProjectId,
      status: { phase: "waiting" },
    });
  });

  it("should detect duplicate assets", async () => {
    const spec = {
      name: "test",
      url: "https://example.com/test.mp4",
    };
    let res = await client.post(`/asset/upload/url`, spec);
    expect(res.status).toBe(201);
    let {
      asset: { id: assetId },
      task: { id: taskId },
    } = await res.json();
    expect(assetId).toMatch(/^[a-f0-9-]{36}$/);
    expect(taskId).toMatch(/^[a-f0-9-]{36}$/);

    res = await client.post(`/asset/upload/url`, spec);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      asset: { id: assetId },
      task: { id: taskId },
    });
  });

  describe("dstorage URLs transformation", () => {
    const testCases = [
      { url: "https://arweave.net/faketxid", expected: "ar://faketxid" },
      {
        url: "https://arweave.net/faketxid2/myFile.mp4",
        expected: "ar://faketxid2/myFile.mp4",
      },
      {
        url: "https://ipfs.example.com/ipfs/fakecid",
        expected: "ipfs://fakecid",
      },
      {
        url: "https://my-gateway.ipfs-provider.io/ipfs/fakecid2",
        expected: "ipfs://fakecid2",
      },
      {
        url: "https://my-gateway.ipfs-provider.io/ipfs/fakecid3/filename.mp4",
        expected: "ipfs://fakecid3/filename.mp4",
      },
      {
        url: "https://untrusted-ipfs.example.com/ipfs/fakecid3",
        expected: null,
      },
    ];

    describe("on creation", () => {
      for (const { url, expected } of testCases) {
        const expectedSource = {
          type: "url",
          ...(expected ? { url: expected, gatewayUrl: url } : { url }),
        };

        it(`${url} to ${expected}`, async () => {
          const spec = { name: "test", url };
          let res = await client.post(`/asset/upload/url`, spec);

          expect(res.status).toBe(201);
          let {
            asset: { source },
          } = await res.json();

          expect(source).toMatchObject(expectedSource);
        });
      }
    });

    describe("on migration", () => {
      for (const { url, expected } of testCases) {
        const expectedSource = {
          type: "url",
          ...(expected ? { url: expected, gatewayUrl: url } : { url }),
        };

        it(`${url} to ${expected}`, async () => {
          client.apiKey = adminApiKey;

          const asset = await db.asset.create({
            id: uuid(),
            name: "test",
            source: {
              type: "url",
              url,
            },
          });

          const prefix = url.substring(0, url.lastIndexOf("/") + 1);

          let res = await client.post(
            `/asset/migrate/dstorage-urls?urlPrefix=${prefix}`
          );
          expect(res.status).toBe(200);

          await expect(res.json()).resolves.toMatchObject({
            total: 1,
            migrated: expected ? 1 : 0,
            assets: expected ? [{ id: asset.id, source: expectedSource }] : [],
          });
        });
      }
    });
  });

  it("should store the creator ID as an object", async () => {
    const spec = {
      name: "test",
      url: "https://example.com/test.mp4",
      creatorId: "i am creator",
    };
    let res = await client.post(`/asset/upload/url`, spec);
    expect(res.status).toBe(201);
    let {
      asset: { id: assetId },
      task: { id: taskId },
    } = await res.json();
    expect(assetId).toMatch(/^[a-f0-9-]{36}$/);
    expect(taskId).toMatch(/^[a-f0-9-]{36}$/);

    res = await client.get(`/asset/${assetId}`);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      id: assetId,
      creatorId: {
        type: "unverified",
        value: "i am creator",
      },
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
        objectStoreId: "mock_vod_store",
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
        userId: nonAdminUser.id,
      });
      asset = db.asset.cleanWriteOnlyResponse(asset);
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

    it("should allow editing asset creator ID", async () => {
      const res = await client.patch(`/asset/${asset.id}`, {
        creatorId: "0xjest",
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toMatchObject({
        ...asset,
        creatorId: { type: "unverified", value: "0xjest" },
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

    it("should disallow jwt playbackPolicy on assets", async () => {
      let playbackPolicy = {
        type: "jwt",
      };
      const res = await client.patch(`/asset/${asset.id}`, {
        playbackPolicy,
      });
      expect(res.status).toBe(422);
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
        [expect.stringContaining("must NOT have additional properties")]
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
    let assetFromIpfs: WithID<Asset>;

    const createAsset = async (
      payload: Omit<Asset, "id" | "playbackId" | "userId">
    ) => {
      const id = uuid();
      const playbackId = await generateUniquePlaybackId(id);
      return db.asset.cleanWriteOnlyResponse(
        await db.asset.create({
          id,
          playbackId,
          userId: nonAdminUser.id,
          ...payload,
        })
      );
    };

    beforeEach(async () => {
      // this dummy one is just to differentiate empty responses from "list all" responses
      await createAsset({
        name: "dummy",
        source: { type: "directUpload" },
        createdAt: Date.now(),
        objectStoreId: "mock_vod_store",
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
      });

      asset = await createAsset({
        name: "test-storage",
        createdAt: Date.now(),
        objectStoreId: "mock_vod_store",
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
      });
      assetFromIpfs = await createAsset({
        name: "test-ipfs-source",
        createdAt: Date.now(),
        objectStoreId: "mock_vod_store",
        source: { type: "url", url: "ipfs://QmW456" },
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
      });
    });

    const expectFindAsset = async (qs: string, shouldFind: boolean | Asset) => {
      const res = await client.get(`/asset?${qs}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      if (shouldFind) {
        const expected = typeof shouldFind === "boolean" ? asset : shouldFind;
        expect(data).toMatchObject([expected]);
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
      await expectFindAsset(`cid=QmX123`, true);
      await expectFindAsset(`cid=QmW456`, assetFromIpfs);
      await expectFindAsset(`sourceUrl=ipfs://QmW456`, assetFromIpfs);
    });

    it("should find asset by NFT metadata CID", async () => {
      await expectFindAsset(
        `filters=[{"id":"nftMetadataCid","value":"somethingelse"}]`,
        false
      );
      await expectFindAsset(
        `filters=[{"id":"nftMetadataCid","value":"${asset.storage.ipfs.nftMetadata.cid}"}]`,
        true
      );
    });

    it("should not mix main and NFT metadata CIDs", async () => {
      await expectFindAsset(`cid=${asset.storage.ipfs.nftMetadata.cid}`, false);
      await expectFindAsset(
        `filter=[{"id":"nftMetadataCid","value":"${asset.storage.ipfs.cid}"}]`,
        false
      );
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
          // @ts-ignore
          // TUS types doesn't work well with node and typescript out of the box: https://github.com/tus/tus-js-client/issues/289#issuecomment-1997073291
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
