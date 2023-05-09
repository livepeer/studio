import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { Asset, User } from "../schema/types";
import { db } from "../store";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";
import { DBSession } from "../store/db";

let server: TestServer;
let ingest: string;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;
let mockAdminUserInput2: User;
let mockNonAdminUserInput2: User;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  ingest = server.ingest[0].base;

  mockAdminUserInput = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUserInput = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };

  mockAdminUserInput2 = {
    email: "user_admin2@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUserInput2 = {
    email: "user_non_admin2@gmail.com",
    password: "y".repeat(64),
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/playback", () => {
  describe("fetching playback URL of different objects", () => {
    let client: TestClient;
    let client2: TestClient;
    let nonAdminToken: string;
    let otherUserToken: string;

    let stream: DBStream;
    let childStream: DBStream;
    let session: DBSession;
    let asset: WithID<Asset>;
    let asset2: WithID<Asset>;

    beforeEach(async () => {
      const sessionId = "5b12c779-efc3-42ba-83d9-c590955556b0";
      await db.objectStore.create({
        id: "mock_vod_store",
        url: "s3+http://user:password@localhost:8080/us-east-1/vod",
        publicUrl: "http://localhost/bucket/vod",
      });

      ({ client, nonAdminToken } = await setupUsers(
        server,
        mockAdminUserInput,
        mockNonAdminUserInput
      ));

      client.jwtAuth = nonAdminToken;

      ({ client: client2, nonAdminToken: otherUserToken } = await setupUsers(
        server,
        mockAdminUserInput2,
        mockNonAdminUserInput2
      ));
      client2.jwtAuth = otherUserToken;

      let res = await client.post("/stream", {
        name: "test-stream",
      });
      expect(res.status).toBe(201);
      stream = await res.json();

      res = await client.post("/asset/request-upload", {
        name: "test-session",
      });
      expect(res.status).toBe(200);
      ({ asset } = await res.json());

      res = await client2.post("/asset/request-upload", {
        name: "test-session",
      });
      expect(res.status).toBe(200);
      ({ asset: asset2 } = await res.json());

      res = await client.post(
        `/stream/${stream.id}/stream?sessionId=${sessionId}`,
        {
          name: "test-recording",
        }
      );
      expect(res.status).toBe(201);
      childStream = await res.json();
      expect(childStream).toMatchObject({ id: expect.any(String) });

      session = await client
        .get(`/session/${sessionId}`)
        .then((res) => res.json());
      expect(session).toMatchObject({
        id: sessionId,
        playbackId: stream.playbackId,
      });

      // API should be open without any auth
      client.jwtAuth = null;
    });

    describe("for streams", () => {
      it("should return playback URL for streams", async () => {
        const res = await client.get(`/playback/${stream.playbackId}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "live",
          meta: {
            live: 0,
            source: [
              {
                hrn: "HLS (TS)",
                type: "html5/application/vnd.apple.mpegurl",
                url: `${ingest}/hls/${stream.playbackId}/index.m3u8`,
              },
            ],
          },
        });
      });

      it("should indicate active streams in live field", async () => {
        await db.stream.update(stream.id, { isActive: true });

        const res = await client.get(`/playback/${stream.playbackId}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "live",
          meta: {
            live: 1,
          },
        });
      });
    });

    describe("for assets", () => {
      it("should return clean 404 for assets without playback recording", async () => {
        const res = await client.get(`/playback/${asset.playbackId}`);
        expect(res.status).toBe(404);
      });

      it("should return playback URL for assets", async () => {
        await db.asset.update(asset.id, {
          playbackRecordingId: "mock_recording_id",
        });
        const res = await client.get(`/playback/${asset.playbackId}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "vod",
          meta: {
            source: [
              {
                hrn: "HLS (TS)",
                type: "html5/application/vnd.apple.mpegurl",
                url: `${ingest}/recordings/mock_recording_id/index.m3u8`,
              },
            ],
          },
        });
      });

      it("should return playback URL assets from CID", async () => {
        const cid = "bafyfoobar";
        await db.asset.update(asset.id, {
          playbackRecordingId: "mock_recording_id_2",
          storage: {
            ipfs: {
              cid: cid,
            },
            status: {
              phase: "ready",
              tasks: {},
            },
          },
        });
        const res = await client.get(`/playback/${cid}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "vod",
          meta: {
            source: [
              {
                hrn: "HLS (TS)",
                type: "html5/application/vnd.apple.mpegurl",
                url: `${ingest}/recordings/mock_recording_id_2/index.m3u8`,
              },
            ],
          },
        });
      });

      it("should return playback URL assets from CID based on source URL lookup", async () => {
        const cid = "bafyfoobar";
        await db.asset.update(asset.id, {
          playbackRecordingId: "mock_recording_id_2",
          source: {
            type: "url",
            url: "ipfs://" + cid,
          },
          status: {
            phase: "ready",
            updatedAt: 1234,
          },
        });
        const res = await client.get(`/playback/${cid}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "vod",
          meta: {
            source: [
              {
                hrn: "HLS (TS)",
                type: "html5/application/vnd.apple.mpegurl",
                url: `${ingest}/recordings/mock_recording_id_2/index.m3u8`,
              },
            ],
          },
        });
      });

      it("should return 404 for CID based on source URL lookup if asset is not ready", async () => {
        const cid = "bafyfoobar";
        await db.asset.update(asset.id, {
          playbackRecordingId: "mock_recording_id_2",
          source: {
            type: "url",
            url: "ipfs://" + cid,
          },
        });
        const res = await client.get(`/playback/${cid}`);
        expect(res.status).toBe(404);
      });

      it("should return playback URL assets from Arweave tx ID based on source URL lookup", async () => {
        const txID = "bafyfoobar";
        await db.asset.update(asset.id, {
          playbackRecordingId: "mock_recording_id_2",
          source: {
            type: "url",
            url: "ar://" + txID,
          },
          status: {
            phase: "ready",
            updatedAt: 1234,
          },
        });
        const res = await client.get(`/playback/${txID}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "vod",
          meta: {
            source: [
              {
                hrn: "HLS (TS)",
                type: "html5/application/vnd.apple.mpegurl",
                url: `${ingest}/recordings/mock_recording_id_2/index.m3u8`,
              },
            ],
          },
        });
      });

      it("should return 404 for Arweave tx ID based on source URL lookup if asset is not ready", async () => {
        const txID = "bafyfoobar";
        await db.asset.update(asset.id, {
          playbackRecordingId: "mock_recording_id_2",
          source: {
            type: "url",
            url: "ar://" + txID,
          },
        });
        const res = await client.get(`/playback/${txID}`);
        expect(res.status).toBe(404);
      });
    });

    describe("for recordings", () => {
      it("should return 404 for unrecorded streams and sessions", async () => {
        let res = await client.get(`/playback/${stream.id}`);
        expect(res.status).toBe(404);
        res = await client.get(`/playback/${childStream.id}`);
        expect(res.status).toBe(404);
        res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(404);
      });

      it("should return 404 for recorded sessions without recording ready", async () => {
        await db.session.update(session.id, {
          record: true,
          recordObjectStoreId: "mock_store",
          lastSeen: Date.now() - 60 * 60 * 1000,
        });
        let res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(404);
      });

      it("should return playback URL for sessions with recording ready", async () => {
        await db.session.update(session.id, {
          record: true,
          recordObjectStoreId: "mock_store",
          lastSeen: Date.now() - 60 * 60 * 1000,
        });
        await db.asset.create({
          id: session.id,
          name: "mock_asset_recording",
          createdAt: session.createdAt,
          source: { type: "recording", sessionId: session.id },
          status: { phase: "ready", updatedAt: Date.now() },
          objectStoreId: "mock_vod_store",
          files: [
            {
              type: "static_transcoded_mp4",
              path: "output.mp4",
            },
            {
              type: "catalyst_hls_manifest",
              path: "output.m3u8",
            },
          ],
        });
        const res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({
          type: "recording",
          meta: {
            source: [
              {
                hrn: "HLS (TS)",
                type: "html5/application/vnd.apple.mpegurl",
                url: `http://localhost/bucket/vod/output.m3u8`,
              },
            ],
          },
        });
      });
    });

    it("should return playback URL for user sessions", async () => {
      // delete the child stream just to make sure we use the user session (they have the same id)
      await db.stream.delete(childStream.id);
      await db.session.update(session.id, {
        version: "v1",
        record: true,
        recordObjectStoreId: "mock_store",
        lastSeen: Date.now() - 60 * 60 * 1000,
      });

      const res = await client.get(`/playback/${session.id}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "recording",
      });
    });

    it("should return playback URL for top-level streams by playbackId", async () => {
      let res = await client.get(`/playback/${stream.id}`);
      expect(res.status).toBe(404);

      res = await client.get(`/playback/${stream.playbackId}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "live",
      });
    });

    it("should return playback URL assets from CID when authenticated", async () => {
      client.jwtAuth = nonAdminToken;
      const cid = "bafyfoobar";
      await db.asset.update(asset.id, {
        playbackRecordingId: "mock_asset_1",
        source: {
          type: "url",
          url: "ipfs://" + cid,
        },
        status: {
          phase: "ready",
          updatedAt: 1234,
        },
      });

      const res = await client.get(`/playback/${cid}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "vod",
        meta: {
          source: [
            {
              hrn: "HLS (TS)",
              type: "html5/application/vnd.apple.mpegurl",
              url: `${ingest}/recordings/mock_asset_1/index.m3u8`,
            },
          ],
        },
      });
    });

    it("should return playback URL asset of user from CID when another one was created before and when authenticated", async () => {
      client2.jwtAuth = otherUserToken;
      const cid = "bafyfoobar";
      await db.asset.update(asset2.id, {
        playbackRecordingId: "mock_asset_2",
        source: {
          type: "url",
          url: "ipfs://" + cid,
        },
        status: {
          phase: "ready",
          updatedAt: 1234,
        },
      });

      const res = await client2.get(`/playback/${cid}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "vod",
        meta: {
          source: [
            {
              hrn: "HLS (TS)",
              type: "html5/application/vnd.apple.mpegurl",
              url: `${ingest}/recordings/mock_asset_2/index.m3u8`,
            },
          ],
        },
      });
    });

    it("should return other available playback URL asset from CID when authenticated", async () => {
      const cid = "bafyfoobar";
      await db.asset.delete(asset2.id);
      await db.asset.update(asset.id, {
        playbackRecordingId: "mock_asset_1",
        source: {
          type: "url",
          url: "ipfs://" + cid,
        },
        status: {
          phase: "ready",
          updatedAt: 1234,
        },
      });

      const res = await client2.get(`/playback/${cid}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "vod",
        meta: {
          source: [
            {
              hrn: "HLS (TS)",
              type: "html5/application/vnd.apple.mpegurl",
              url: `${ingest}/recordings/mock_asset_1/index.m3u8`,
            },
          ],
        },
      });
    });
  });
});
