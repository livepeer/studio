import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { Asset, Task, User } from "../schema/types";
import { db } from "../store";
import { WithID } from "../store/types";

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
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminApiKey: string;

  beforeEach(async () => {
    // await db.objectStore.create({
    //   id: "mock_vod_store",
    //   url: "s3+http://user:password@localhost:8080/us-east-1/vod",
    //   publicUrl: "http://localhost/bucket/vod",
    // });
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminApiKey } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.apiKey = adminApiKey;

    const res = await client.post(`/experiment`, {
      name: "lit-signing-condition",
      audienceUserIds: [nonAdminUser.id],
    });
    expect(res.status).toBe(201);
  });

  describe("experimental APIs", () => {
    it("should register APIs under a - path segment", async () => {
      // control case
      let res = await client.post(`/experiment/-/non-existing-experiment`, {});
      expect(res.status).toBe(404);

      res = await client.post(
        `/experiment/-/lit-signing-condition/verify-lit-jwt`
      );
      expect(res.status).toBe(403);
      const { errors } = await res.json();
      expect(errors[0]).toContain("user is not a subject of experiment");
    });
  });

  describe("experiment check api", () => {
    it("returns 403 for user not in experiment", async () => {
      const res = await client.get(`/experiment/check/lit-signing-condition`);
      expect(res.status).toBe(403);
      const { errors } = await res.json();
      expect(errors[0]).toContain("not a subject");
    });

    it("returns 204 for user in experiment", async () => {
      client.apiKey = nonAdminApiKey;

      const res = await client.get(`/experiment/check/lit-signing-condition`);
      expect(res.status).toBe(204);
    });

    it("allows admins to check for other users", async () => {
      const res = await client.get(
        `/experiment/check/lit-signing-condition?userId=${nonAdminUser.id}`
      );
      expect(res.status).toBe(204);
    });

    it("allows admins to check for other users using a playback ID", async () => {
      const { playbackId: assetId } = await db.asset.create({
        id: uuid(),
        playbackId: uuid(),
        userId: nonAdminUser.id,
      } as any);

      const { playbackId: streamId } = await db.stream.create({
        id: uuid(),
        playbackId: uuid(),
        userId: nonAdminUser.id,
      } as any);

      let res = await client.get(
        `/experiment/check/lit-signing-condition?playbackId=${assetId}`
      );
      expect(res.status).toBe(204);
      res = await client.get(
        `/experiment/check/lit-signing-condition?playbackId=${streamId}`
      );
      expect(res.status).toBe(204);
    });
  });
});
