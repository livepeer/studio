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

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  ingest = JSON.parse(server.ingest)[0].base;

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

describe("controllers/playback", () => {
  describe("fetching playback URL of different objects", () => {
    let client: TestClient;
    let nonAdminToken: string;

    let stream: DBStream;
    let session: DBStream;
    let userSession: DBSession;
    let asset: WithID<Asset>;

    beforeEach(async () => {
      await db.objectStore.create({
        id: "mock_vod_store",
        url: "http://user:password@localhost:8080/us-east-1/vod",
      });

      ({ client, nonAdminToken } = await setupUsers(
        server,
        mockAdminUserInput,
        mockNonAdminUserInput
      ));
      client.jwtAuth = nonAdminToken;

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

      res = await client.post(`/stream/${stream.id}/stream`, {
        name: "test-recording",
      });
      expect(res.status).toBe(201);
      session = await res.json();
      expect(session).toMatchObject({ id: expect.any(String) });

      userSession = await client
        .get(`/session/${session.id}`)
        .then((res) => res.json());
      expect(userSession).toMatchObject({
        id: session.id,
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
    });

    describe("for recordings", () => {
      it("should return 404 for unrecorded streams and sessions", async () => {
        let res = await client.get(`/playback/${stream.id}`);
        expect(res.status).toBe(404);
        res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(404);
        res = await client.get(`/playback/${userSession.id}`);
        expect(res.status).toBe(404);
      });

      it("should return 404 for recorded sessions without recording ready", async () => {
        await db.stream.update(session.id, { record: true });
        let res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(404);

        await db.stream.update(session.id, {
          recordObjectStoreId: "mock_store",
        });
        res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(404);

        await db.stream.update(session.id, { lastSeen: Date.now() });
        res = await client.get(`/playback/${session.id}`);
        expect(res.status).toBe(404);
      });

      it("should return playback URL for sessions with recording ready", async () => {
        await db.stream.update(session.id, {
          record: true,
          recordObjectStoreId: "mock_store",
          lastSeen: Date.now() - 60 * 60 * 1000,
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
                url: `${ingest}/recordings/${session.id}/index.m3u8`,
              },
            ],
          },
        });
      });
    });

    it("should return playback URL for user sessions", async () => {
      await db.session.update(userSession.id, {
        record: true,
        recordObjectStoreId: "mock_store",
        lastSeen: Date.now() - 60 * 60 * 1000,
      });
      const res = await client.get(`/playback/${userSession.id}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "recording",
      });
    });

    it("should return playback URL for top-level streams", async () => {
      await db.stream.update(stream.id, {
        record: true,
        recordObjectStoreId: "mock_store",
        lastSeen: Date.now() - 60 * 60 * 1000,
      });
      let res = await client.get(`/playback/${stream.id}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "recording",
      });

      res = await client.get(`/playback/${stream.playbackId}`);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toMatchObject({
        type: "live",
      });
    });
  });
});
