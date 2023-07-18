import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { Attestation, Experiment, Asset, User } from "../schema/types";
import { WithID } from "../store/types";
import { db } from "../store";
import { DBStream } from "../store/stream-table";
import { DBSession } from "../store/db";

const EXPECTED_CROSS_USER_ASSETS_CUTOFF_DATE = Date.parse(
  "2023-06-06T00:00:00.000Z"
);

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

    const cid = "bafyfoobar";

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

      const assetPatch = {
        source: { type: "url", url: "ipfs://" + cid },
        status: { phase: "ready", updatedAt: Date.now() },
      } as const;
      await db.asset.update(asset.id, {
        playbackRecordingId: "mock_asset_1",
        createdAt: EXPECTED_CROSS_USER_ASSETS_CUTOFF_DATE + 1000,
        ...assetPatch,
      });
      await db.asset.update(asset2.id, {
        playbackRecordingId: "mock_asset_2",
        createdAt: EXPECTED_CROSS_USER_ASSETS_CUTOFF_DATE + 2000,
        ...assetPatch,
      });

      session = await client
        .get(`/session/${sessionId}`)
        .then((res) => res.json());
      expect(session).toMatchObject({
        id: sessionId,
        playbackId: stream.playbackId,
      });
    });

    describe("for streams", () => {
      it("should return playback URLs for streams", async () => {
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
              {
                hrn: "WebRTC (H264)",
                type: "html5/video/h264",
                url: `${ingest}/webrtc/${stream.playbackId}`,
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
      it("should return 4xx for assets not ready", async () => {
        await db.asset.update(asset.id, {
          status: { phase: "processing", updatedAt: Date.now() },
        });

        let res = await client.get(`/playback/${asset.playbackId}`);
        expect(res.status).toBe(422);

        res = await client.get(`/playback/${cid}`);
        expect(res.status).toBe(404);

        const txID = "randomstring";
        await db.asset.update(asset.id, {
          source: { type: "url", url: "ar://" + txID },
        });
        res = await client.get(`/playback/${txID}`);
        expect(res.status).toBe(404);
      });

      it("should return 404 for assets without playback recording", async () => {
        await db.asset.update(asset.id, { playbackRecordingId: null });

        const res = await client.get(`/playback/${asset.playbackId}`);
        expect(res.status).toBe(404);
      });

      it("should return playback URL for assets", async () => {
        const res = await client.get(`/playback/${asset.playbackId}`);
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

      it("should return playback URL assets with exported CID", async () => {
        await db.asset.update(asset.id, {
          source: { type: "directUpload" },
          storage: { ipfs: { cid } },
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

      it("should return playback URL assets from CID based on source URL lookup", async () => {
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

      it("should NOT return other users assets by CID", async () => {
        await db.asset.delete(asset2.id);

        const res = await client2.get(`/playback/${cid}`);
        expect(res.status).toBe(404);
      });

      describe("on lvpr.tv, should still return other users playback URL by CID", () => {
        beforeEach(async () => {
          await db.asset.delete(asset2.id);
        });

        const checkOrigin = (origin: string, success: boolean) => {
          it("for origin " + origin, async () => {
            const res = await client2.get(`/playback/${cid}`, {
              headers: { origin },
            });
            expect(res.status).toBe(success ? 200 : 404);
            if (success) {
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
            }
          });
        };

        checkOrigin(undefined, false);

        checkOrigin("https://lvpr.tv", true);
        checkOrigin("https://monster.lvpr.tv", true);

        checkOrigin("https://lvpr.tv/", false);
        checkOrigin("http://lvpr.tv", false);
        checkOrigin("https://notlvpr.tv", false);
        checkOrigin("http://localhost:3000", false);
      });

      it("should return playback URL assets from Arweave tx ID based on source URL lookup", async () => {
        const txID = "randomstring";
        await db.asset.update(asset.id, {
          source: {
            type: "url",
            url: "ar://" + txID,
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
                url: `${ingest}/recordings/mock_asset_1/index.m3u8`,
              },
            ],
          },
        });
      });
    });

    describe("for attestations", () => {
      it("should return playback URL with the attestation metadata using the exported CID", async () => {
        const attestation: WithID<Attestation> = {
          id: "mock_attestation_id",
          createdAt: Date.now(),
          primaryType: "VideoAttestation",
          domain: {
            name: "Verifiable Video",
            version: "1",
          },
          message: {
            video: `ipfs://${cid}`,
            attestations: [
              {
                role: "creator",
                address: "0xB7D5D7a6FcFE31611E4673AA3E61f21dC56723fC",
              },
            ],
            signer: "0xB7D5D7a6FcFE31611E4673AA3E61f21dC56723fC",
            timestamp: 1684241365,
          },
          signature:
            "0xb5e2ba76cae6b23ad6613753f701f9b8bb696d58cad9c7c11ca0fa10ad5a6b123fef9f6639e317f1d3f1a3131e50bfeb83dc02dd69a6b12cb7db665d19a9a49b1b",
        };

        await db.attestation.create(attestation);
        await db.asset.update(asset.id, {
          source: { type: "directUpload" },
          storage: { ipfs: { cid } },
        });

        const res = await client.get(`/playback/mock_attestation_id`);
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
            attestation,
          },
        });
      });
    });

    describe("for unauthenticated requests", () => {
      beforeEach(() => {
        client.jwtAuth = null;
      });

      it("should return playback URL by playback ID", async () => {
        const res = await client.get(`/playback/${asset.playbackId}`);
        expect(res.status).toBe(200);
      });

      it("should NOT return playback URL by dStorage ID", async () => {
        const res = await client.get(`/playback/${cid}`);
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

    describe("cross-user playback backward compatibility", () => {
      beforeEach(async () => {
        await db.asset.update(asset.id, {
          createdAt: EXPECTED_CROSS_USER_ASSETS_CUTOFF_DATE - 2000,
        });
        await db.asset.update(asset2.id, {
          createdAt: EXPECTED_CROSS_USER_ASSETS_CUTOFF_DATE - 1000,
        });
      });

      it("should return playback URL asset of user from CID", async () => {
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

      it("should return other available playback URL asset from CID", async () => {
        await db.asset.delete(asset2.id);

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

      describe("for unauthenticated requests", () => {
        beforeEach(() => {
          client.jwtAuth = null;
        });

        it("should return playback URL by playback ID", async () => {
          const res = await client.get(`/playback/${asset.playbackId}`);
          expect(res.status).toBe(200);
        });

        it("should return playback URL by dStorage ID", async () => {
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
      });
    });
  });
});
