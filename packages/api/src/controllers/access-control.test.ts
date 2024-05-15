import serverPromise, { TestServer } from "../test-server";
import {
  TestClient,
  clearDatabase,
  setupUsers,
  AuxTestServer,
  startAuxTestServer,
} from "../test-helpers";
import { SigningKey, SigningKeyResponsePayload, User } from "../schema/types";
import { WithID } from "../store/types";
import { Asset } from "../schema/types";
import { v4 as uuid } from "uuid";
import { db } from "../store";
import { generateUniquePlaybackId } from "./generate-keys";
import { json as bodyParserJson } from "body-parser";
import { semaphore } from "../util";

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

describe("controllers/access-control", () => {
  let client: TestClient;
  let adminUser: User;
  let adminToken: string;
  let nonAdminUser: User;
  let nonAdminToken: string;
  let gatedAsset: WithID<Asset>;

  describe("webhook authorization", () => {
    let webhookServer: AuxTestServer;
    let hookSem: ReturnType<typeof semaphore>;
    let webhookStatusCode: number;
    let webhookResponseBody: string;

    beforeAll(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;

      webhookServer = await startAuxTestServer();
      webhookServer.app.post("/hook", (req, res) => {
        hookSem.release();
        res.status(webhookStatusCode);
        res.send(webhookResponseBody).end();
      });
      const webhook = await server.db.webhook.create({
        id: uuid(),
        userId: nonAdminUser.id,
        name: "auth-webhook",
        kind: "webhook",
        createdAt: Date.now(),
        events: [],
        url: `http://localhost:${webhookServer.port}/hook`,
      });

      let id = uuid();
      gatedAsset = await db.asset.create({
        id,
        name: "test-storage",
        source: { type: "directUpload" },
        createdAt: Date.now(),
        playbackId: await generateUniquePlaybackId(id),
        playbackPolicy: {
          type: "webhook",
          webhookId: webhook.id,
        },
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
        userId: nonAdminUser.id,
      });
    });
    afterAll(() => webhookServer.close());

    beforeEach(async () => {
      hookSem = semaphore();
      webhookStatusCode = 204;
      webhookResponseBody = "";
    });

    it("should allow playback on gated asset", async () => {
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "accessKey",
        accessKey: "foo",
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({});
      await hookSem.wait(3000);
    });

    it("should deny for non 2xx", async () => {
      webhookStatusCode = 403;
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "accessKey",
        accessKey: "foo",
      });
      expect(res.status).toBe(403);
      await hookSem.wait(3000);
    });

    it("should deny for non 2xx status in body", async () => {
      webhookStatusCode = 200;
      webhookResponseBody = JSON.stringify({ ret: 403 });
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "accessKey",
        accessKey: "foo",
      });
      expect(res.status).toBe(403);
      await hookSem.wait(3000);
    });
  });

  describe("basic CRUD with JWT authorization", () => {
    let signingKey: WithID<SigningKey>;
    let gatedPlaybackId: string;
    let publicPlaybackId: string;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;

      let created: SigningKeyResponsePayload = await client
        .post("/access-control/signing-key")
        .then((res) => res.json());
      let res = await client.get(`/access-control/signing-key/${created.id}`);
      signingKey = await res.json();
      const res2 = await client.post("/stream", {
        name: "test",
        playbackPolicy: {
          type: "jwt",
        },
      });
      const stream = await res2.json();
      gatedPlaybackId = stream.playbackId;
      const res3 = await client.post("/stream", {
        name: "test",
        playbackPolicy: {
          type: "public",
        },
      });
      const publicStream = await res3.json();
      publicPlaybackId = publicStream.playbackId;
      let id = uuid();
      gatedAsset = await db.asset.create({
        id,
        name: "test-storage",
        source: { type: "directUpload" },
        createdAt: Date.now(),
        playbackId: await generateUniquePlaybackId(id),
        playbackPolicy: {
          type: "jwt",
        },
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
        userId: nonAdminUser.id,
      });
    });

    it("should create a gate stream and allow playback with given public key", async () => {
      client.jwtAuth = adminToken;
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        pub: signingKey.publicKey,
        type: "jwt",
      });

      expect(res2.status).toBe(200);
    });

    it("should not allow playback on not existing streams or public keys", async () => {
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+0000000000123`,
        pub: signingKey.publicKey,
        type: "jwt",
      });
      expect(res.status).toBe(404);
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        pub: "00000000000000",
        type: "jwt",
      });
      expect(res2.status).toBe(403);
    });

    it("should not allow playback if stream is gated an pub is missing", async () => {
      client.jwtAuth = adminToken;
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        type: "jwt",
      });
      expect(res2.status).toBe(403);
    });

    it("should not allow playback if stream and public key does not share the same owner", async () => {
      client.jwtAuth = adminToken;
      const otherStream = await client.post("/stream", {
        name: "test",
        playbackPolicy: {
          type: "jwt",
        },
      });
      const otherStreamPlaybackId = (await otherStream.json()).playbackId;
      const res = await client.post("/access-control/gate", {
        stream: `video+${otherStreamPlaybackId}`,
        pub: signingKey.publicKey,
        type: "jwt",
      });
      expect(res.status).toBe(404);
    });

    it("should not allow playback if origin is not in playback.allowedOrigins", async () => {
      gatedAsset.playbackPolicy.type = "jwt";
      gatedAsset.playbackPolicy.allowedOrigins = ["http://localhost:3000"];
      await db.asset.update(gatedAsset.id, {
        playbackPolicy: gatedAsset.playbackPolicy,
      });
      let asset = await db.asset.get(gatedAsset.id);
      expect(asset.playbackPolicy.allowedOrigins).toEqual([
        "http://localhost:3000",
      ]);
      const res3 = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "jwt",
        pub: "notExistingPubKey",
        webhookPayload: {
          headers: {
            origin: "https://example.com",
          },
        },
      });
      expect(res3.status).toBe(403);
      let resJson = await res3.json();
      expect(resJson.errors[0]).toBe(
        `Content is gated and origin not in allowed origins`
      );
      const res4 = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "jwt",
        pub: "notExistingPubKey",
        webhookPayload: {
          headers: {
            origin: "http://localhost:3000",
          },
        },
      });
      expect(res4.status).toBe(403);
      let resJson2 = await res4.json();
      expect(resJson2.errors[0]).toBe(
        "Content is gated and corresponding public key not found"
      );
    });

    it("should allow playback on public playbackId with and without a public key provided", async () => {
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${publicPlaybackId}`,
        type: "jwt",
      });
      expect(res.status).toBe(200);
      client.jwtAuth = nonAdminToken;
      const stream = await client.post("/stream", {
        name: "test",
      });
      client.jwtAuth = adminToken;
      const streamPlaybackId = (await stream.json()).playbackId;
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${streamPlaybackId}`,
        type: "jwt",
      });
      expect(res2.status).toBe(200);
    });

    it("should allow playback if playbackPolicy is not specified", async () => {
      client.jwtAuth = nonAdminToken;
      const stream = await client.post("/stream", {
        name: "test",
      });
      client.jwtAuth = adminToken;
      const streamPlaybackId = (await stream.json()).playbackId;
      const res = await client.post("/access-control/gate", {
        stream: `video+${streamPlaybackId}`,
        type: "jwt",
        pub: signingKey.publicKey,
      });
      expect(res.status).toBe(200);
    });

    it("should allow playback on gated asset", async () => {
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "jwt",
        pub: signingKey.publicKey,
      });
      expect(res.status).toBe(200);
    });

    it("should not allow playback if user is suspended", async () => {
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "jwt",
        pub: signingKey.publicKey,
      });
      expect(res.status).toBe(200);
      await db.user.update(gatedAsset.userId, { suspended: true });

      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedAsset.playbackId}`,
        type: "jwt",
        pub: signingKey.publicKey,
      });
      expect(res2.status).toBe(404);
      await db.user.update(gatedAsset.userId, { suspended: false });
    });

    it("should not allow playback if signing key is deleted or disabled", async () => {
      client.jwtAuth = nonAdminToken;
      await client.patch(`/access-control/signing-key/${signingKey.id}`, {
        disabled: true,
      });
      client.jwtAuth = adminToken;
      const res = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        type: "jwt",
        pub: signingKey.publicKey,
      });
      expect(res.status).toBe(403);
      client.jwtAuth = nonAdminToken;
      await client.patch(`/access-control/signing-key/${signingKey.id}`, {
        disabled: false,
      });
      await client.delete(`/access-control/signing-key/${signingKey.id}`);
      client.jwtAuth = adminToken;
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        type: "jwt",
        pub: signingKey.publicKey,
      });
      expect(res2.status).toBe(403);
    });
  });
});
