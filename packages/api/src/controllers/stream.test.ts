import { json as bodyParserJson } from "body-parser";
import { v4 as uuid } from "uuid";

import {
  ObjectStore,
  MultistreamTarget,
  Stream,
  StreamPatchPayload,
  User,
  StreamSetActivePayload,
  StreamHealthPayload,
} from "../schema/types";
import { db } from "../store";
import { DBStream } from "../store/stream-table";
import { DBWebhook } from "../store/webhook-table";
import {
  TestClient,
  clearDatabase,
  startAuxTestServer,
  setupUsers,
  AuxTestServer,
} from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";
import { semaphore, sleep } from "../util";
import { generateUniquePlaybackId } from "./generate-keys";

const uuidRegex = /[0-9a-f]+(-[0-9a-f]+){4}/;

let server: TestServer;
let mockStore: ObjectStore & { kind: string };
let mockTarget: MultistreamTarget;
let mockUser: User;
let mockAdminUser: User;
let mockNonAdminUser: User;
let postMockStream: Stream;
// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  postMockStream = require("./wowza-hydrate.test-data.json").stream;
  delete postMockStream.id;
  delete postMockStream.kind;
  postMockStream.presets = ["P360p30fps16x9", "P144p30fps16x9"];
  postMockStream.renditions = {
    bbb_360p:
      "/stream/305b9fa7-c6b3-4690-8b2e-5652a2556524/P360p30fps16x9.m3u8",
    thesource_bbb: "/stream/305b9fa7-c6b3-4690-8b2e-5652a2556524/source.m3u8",
    random_prefix_bbb_160p:
      "/stream/305b9fa7-c6b3-4690-8b2e-5652a2556524/P144p30fps16x9.m3u8",
  };
  postMockStream.objectStoreId = "mock_store";
  postMockStream.wowza.streamNameGroups = [
    {
      name: "bbb_all",
      renditions: ["thesource_bbb", "bbb_360p", "random_prefix_bbb_160p"],
    },
    {
      name: "bbb_mobile",
      renditions: ["random_prefix_bbb_160p"],
    },
  ];

  mockUser = {
    email: `mock_user@gmail.com`,
    password: "z".repeat(64),
  };

  mockAdminUser = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUser = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };

  mockStore = {
    id: "mock_store",
    url: "https+s3://example.com/bucket-name",
    publicUrl: "http://example-public",
    userId: mockAdminUser.id,
    kind: "object-store",
  };

  mockTarget = {
    url: "rtmps://ultimate.sports.tv/loop/1125fts",
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/stream", () => {
  let client: TestClient;
  let adminUser: User;
  let adminToken: string;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;
  let nonAdminApiKey: string;

  beforeEach(async () => {
    await server.store.create(mockStore);

    ({
      client,
      adminUser,
      adminToken,
      adminApiKey,
      nonAdminUser,
      nonAdminToken,
      nonAdminApiKey,
    } = await setupUsers(server, mockAdminUser, mockNonAdminUser));
    client.jwtAuth = adminToken;
  });

  describe("basic CRUD with JWT authorization", () => {
    it("should not get streams with no authorization", async () => {
      client.jwtAuth = "";
      for (let i = 0; i < 10; i += 1) {
        const document = {
          id: uuid(),
          kind: "stream",
        };
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        expect(res.status).toBe(401);
      }
      const res = await client.get("/stream");
      expect(res.status).toBe(401);
    });

    it("should get all streams with admin authorization", async () => {
      for (let i = 0; i < 5; i += 1) {
        const document = {
          id: uuid(),
          kind: "stream",
          deleted: i > 3 ? true : undefined,
        } as DBStream;
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        const stream = await res.json();
        expect(stream).toEqual(server.db.stream.addDefaultFields(document));
      }

      const res = await client.get("/stream");
      expect(res.status).toBe(200);
      const streams = await res.json();
      expect(streams.length).toEqual(4);
      const resAll = await client.get("/stream?all=1");
      expect(resAll.status).toBe(200);
      const streamsAll = await resAll.json();
      expect(streamsAll.length).toEqual(5);
    });

    it("should not get empty list with next page", async () => {
      const sources = [];
      for (let i = 0; i < 5; i += 1) {
        const document = {
          id: i + uuid(), // object should be sorted for this test to work as intended
          kind: "stream",
          deleted: i < 3 ? true : undefined,
        } as DBStream;
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        const stream = await res.json();
        expect(stream).toEqual(server.db.stream.addDefaultFields(document));
        sources.push(stream);
      }

      const res = await client.get("/stream?limit=3");
      expect(res.status).toBe(200);
      const streams = await res.json();
      expect(streams.length).toEqual(2);
      sources[3].user = {};
      sources[4].user = {};
      expect(streams[0]).toStrictEqual(sources[3]);
      expect(streams[1]).toStrictEqual(sources[4]);
    });

    it("should get some of the streams & get a working next Link", async () => {
      for (let i = 0; i < 13; i += 1) {
        const document = {
          id: uuid(),
          kind: "stream",
        } as DBStream;
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        const stream = await res.json();
        expect(stream).toEqual(server.db.stream.addDefaultFields(document));
      }
      const res = await client.get(`/stream?limit=11`);
      const streams = await res.json();
      expect(res.headers.raw().link).toBeDefined();
      expect(res.headers.raw().link.length).toBe(1);
      expect(streams.length).toEqual(11);
    });

    it("should reject streams with object stores that do not exist", async () => {
      await db.objectStore.delete(mockStore.id);

      const res = await client.post("/stream", { ...postMockStream });
      expect(res.status).toBe(400);
    });

    describe("stream creation validation", () => {
      let msTarget: MultistreamTarget;

      beforeEach(async () => {
        msTarget = await server.db.multistreamTarget.fillAndCreate({
          ...mockTarget,
          userId: adminUser.id,
        });
      });

      it("should reject multistream targets without a profile", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: { targets: [{ id: msTarget.id }] },
        });
        expect(res.status).toBe(422);
      });

      it("should reject multistream targets referencing an inexistent profile", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: { targets: [{ profile: "hello", id: msTarget.id }] },
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(
          "multistream target profile not found"
        );
      });

      it("should reject multistream targets with an invalid spec", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [
              {
                profile: "test_stream_360p",
                spec: { name: "this actually needed a url" },
              },
            ],
          },
        });
        expect(res.status).toBe(422);
      });

      it("should reject multistream targets without an id or spec", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: { targets: [{ profile: "test_stream_360p" }] },
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(
          `must have either an "id" or a "spec"`
        );
      });

      it("should reject multistream targets with both an id and a spec", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [
              {
                profile: "test_stream_360p",
                id: msTarget.id,
                spec: mockTarget,
              },
            ],
          },
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(
          `must have either an "id" or a "spec"`
        );
      });

      it("should reject duplicate multistream targets", async () => {
        let res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [
              {
                profile: "test_stream_360p",
                id: msTarget.id,
              },
              {
                profile: "test_stream_360p",
                id: msTarget.id,
              },
            ],
          },
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(
          `multistream target {id,profile} must be unique`
        );

        // Should allow same ID if using different profiles
        res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [
              {
                profile: "test_stream_240p",
                id: msTarget.id,
              },
              {
                profile: "test_stream_360p",
                id: msTarget.id,
              },
            ],
          },
        });
        expect(res.status).toBe(201);
      });

      it("should reject references to other users multistream targets", async () => {
        client.jwtAuth = nonAdminToken;
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [{ profile: "test_stream_360p", id: msTarget.id }],
          },
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(`multistream target not found`);
      });

      it(`should reject streams with a "source" profile`, async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          wowza: undefined,
          profiles: [
            {
              name: "source",
              width: 1920,
              height: 1080,
              bitrate: 1024,
              fps: 30,
            },
          ],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toBe(`profile cannot be named "source"`);
      });

      it("should reject streams with scene classification empty array", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          detection: { sceneClassification: [] },
        });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.errors[0]).toContain(`\"minItems\"`);
      });

      it("should reject streams with scene classification empty object", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          detection: { sceneClassification: [{}] },
        });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.errors[0]).toContain(`\"required\"`);
      });

      it("should reject streams with inexistent scene classification", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          detection: { sceneClassification: [{ name: "animal" }] },
        });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.errors[0]).toContain(`\"enum\"`);
      });
    });

    describe("stream creation", () => {
      let msTarget: MultistreamTarget;

      beforeEach(async () => {
        msTarget = await server.db.multistreamTarget.fillAndCreate({
          ...mockTarget,
          userId: adminUser.id,
        });
      });

      it("should create a stream", async () => {
        const now = Date.now();
        const res = await client.post("/stream", { ...postMockStream });
        expect(res.status).toBe(201);
        const stream = await res.json();
        expect(stream.id).toBeDefined();
        expect(stream.kind).toBe("stream");
        expect(stream.name).toBe("test_stream");
        expect(stream.createdAt).toBeGreaterThanOrEqual(now);
        const document = await server.store.get(`stream/${stream.id}`);
        expect(server.db.stream.addDefaultFields(document)).toEqual(stream);
      });

      it("should create a stream with creator ID", async () => {
        const now = Date.now();
        const res = await client.post("/stream", {
          ...postMockStream,
          creatorId: "jest",
        });
        expect(res.status).toBe(201);
        const stream = await res.json();
        expect(stream.id).toBeDefined();
        expect(stream.creatorId).toEqual({ type: "unverified", value: "jest" });
      });

      it("should create stream with valid multistream target ID", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [{ profile: "test_stream_360p", id: msTarget.id }],
          },
        });
        expect(res.status).toBe(201);
      });

      it("should create a test user stream", async () => {
        await server.db.user.update(adminUser.id, {
          isTestUser: true,
        });
        const res = await client.post("/stream", {
          ...postMockStream,
        });
        const data = await res.json();
        expect(data.playbackId).toMatch(/.+-test$/);
      });

      it("should create stream with valid detection config", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          detection: { sceneClassification: [{ name: "soccer" }] },
        });
        expect(res.status).toBe(201);
      });

      it("should create stream with inline multistream target", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          multistream: {
            targets: [
              {
                profile: "test_stream_360p",
                videoOnly: true,
                spec: mockTarget,
              },
            ],
          },
        });
        expect(res.status).toBe(201);
        const created = await res.json();
        const resultMst = created.multistream.targets[0];
        expect(resultMst.profile).toEqual("test_stream_360p");
        expect(resultMst.spec).toBeUndefined();
        expect(resultMst.id).toBeDefined();
        expect(resultMst.id).not.toEqual(msTarget.id);
        expect(resultMst.videoOnly).toBe(true);

        const saved = await server.db.multistreamTarget.get(resultMst.id);
        expect(saved).toBeDefined();
        expect(saved.userId).toEqual(adminUser.id);
      });
    });

    it("should create a stream, delete it, and error when attempting additional delete or replace", async () => {
      const res = await client.post("/stream", { ...postMockStream });
      expect(res.status).toBe(201);
      const stream = await res.json();
      expect(stream.id).toBeDefined();

      const document = await server.store.get(`stream/${stream.id}`);
      expect(server.db.stream.addDefaultFields(document)).toEqual(stream);

      await server.store.delete(`stream/${stream.id}`);
      const deleted = await server.store.get(`stream/${stream.id}`);
      expect(deleted).toBe(null);

      // it should return a NotFound Error when trying to delete a record that doesn't exist
      try {
        await server.store.delete(`stream/${stream.id}`);
      } catch (err) {
        expect(err.status).toBe(404);
      }

      // it should return a NotFound Error when trying to replace a record that doesn't exist
      try {
        await server.store.replace(document);
      } catch (err) {
        expect(err.status).toBe(404);
      }
    });

    it("should create a stream and add a multistream target for it", async () => {
      const res = await client.post("/stream", { ...postMockStream });
      expect(res.status).toBe(201);
      const stream = await res.json();
      expect(stream.id).toBeDefined();

      const document = await server.store.get(`stream/${stream.id}`);
      expect(server.db.stream.addDefaultFields(document)).toEqual(stream);

      const res2 = await client.post(
        `/stream/${stream.id}/create-multistream-target`,
        {
          profile: "source",
          videoOnly: false,
          spec: { name: "target-name", url: "rtmp://test/test" },
        }
      );
      expect(res2.status).toBe(200);
      const body = await res2.json();
      expect(body.id).toBeDefined();
    });

    describe("set active and heartbeat", () => {
      const callSetActive = async (
        streamId: string,
        payload: StreamSetActivePayload
      ) => {
        const res = await client.put(`/stream/${streamId}/setactive`, payload);
        expect(res.status).toBe(204);
        return server.db.stream.get(streamId);
      };

      const createAndActivateStream = async (startedAt?: number) => {
        let res = await client.post("/stream", { ...postMockStream });
        expect(res.status).toBe(201);
        const stream = await res.json();
        expect(stream.id).toBeDefined();
        expect(!!stream.active).toBe(false);

        return callSetActive(stream.id, {
          active: true,
          startedAt: startedAt || Date.now(),
          hostName: "jest-test-runner",
        });
      };

      const expectError = async (streamId: string, msg: string) => {
        const res = await client.put(`/stream/${streamId}/setactive`, {
          active: true,
        });
        expect(res.status).toBe(403);
        const response = await res.json();
        expect(response).toMatchObject({
          errors: [expect.stringContaining(msg)],
        });
      };

      it("should be admin only", async () => {
        client.jwtAuth = nonAdminToken;
        await expectError("1234", "not have admin");
      });

      it("should disallow setting suspended streams or users", async () => {
        client.jwtAuth = nonAdminToken;
        let res = await client.post("/stream", postMockStream);
        expect(res.status).toBe(201);
        const stream = await res.json();

        res = await client.patch(`/stream/${stream.id}`, { suspended: true });
        expect(res.status).toBe(204);

        client.jwtAuth = adminToken;
        await expectError(stream.id, "stream is suspended");

        await db.stream.update(stream.id, { suspended: false });
        await db.user.update(stream.userId, { suspended: true });

        await expectError(stream.id, "user is suspended");

        await db.user.update(stream.userId, { suspended: false });

        // make sure everything works if neither suspended
        await callSetActive(stream.id, { active: true });
      });

      it("should set stream's active field", async () => {
        const startedAt = Date.now();
        const updatedStream = await createAndActivateStream(startedAt);

        expect(updatedStream.isActive).toBe(true);
        expect(updatedStream.lastSeen).toBeGreaterThan(startedAt);
        expect(updatedStream.mistHost).toBe("jest-test-runner");
      });

      it("should disallow turning off active from other host", async () => {
        const stream = await createAndActivateStream();

        const setActivePayload = {
          active: false,
          startedAt: Date.now(),
          hostName: "other-host",
        };
        const updatedStream = await callSetActive(stream.id, setActivePayload);

        expect(updatedStream.isActive).toBe(true);
        expect(updatedStream.lastSeen).toBeLessThan(setActivePayload.startedAt);
        expect(updatedStream.mistHost).not.toEqual(setActivePayload.hostName);
      });

      it("should bump the last seen value", async () => {
        const stream = await createAndActivateStream();
        const timeBeforeBump = Date.now();
        expect(stream.lastSeen).toBeLessThan(timeBeforeBump);

        const setActivePayload = {
          active: true,
          startedAt: stream.lastSeen,
          hostName: stream.mistHost,
        };
        const updatedStream = await callSetActive(stream.id, setActivePayload);

        expect(updatedStream.isActive).toBe(true);
        expect(updatedStream.lastSeen).toBeGreaterThan(timeBeforeBump);
        expect(updatedStream.mistHost).toEqual(setActivePayload.hostName);
      });

      it("heartbeat should bump the last seen value", async () => {
        const stream = await createAndActivateStream();
        const timeBeforeBump = Date.now();
        expect(stream.lastSeen).toBeLessThan(timeBeforeBump);

        const res = await client.post(`/stream/${stream.id}/heartbeat`);

        expect(res.status).toBe(204);
        const updatedStream = await server.db.stream.get(stream.id);
        expect(updatedStream.lastSeen).toBeGreaterThan(timeBeforeBump);
      });

      it("should allow changing the mist host as well", async () => {
        const stream = await createAndActivateStream();

        const setActivePayload = {
          active: true,
          startedAt: Date.now(),
          hostName: "other-host",
        };
        const updatedStream = await callSetActive(stream.id, setActivePayload);

        expect(updatedStream.isActive).toBe(true);
        expect(updatedStream.lastSeen).toBeGreaterThan(stream.lastSeen);
        expect(updatedStream.mistHost).toEqual(setActivePayload.hostName);
      });

      it("should disallow changing record when steam is active", async () => {
        const stream = await createAndActivateStream();

        let res = await client.patch(`/stream/${stream.id}`, {
          record: false,
        });
        expect(res.status).toBe(400);
        let json = await res.json();
        expect(json.errors[0]).toContain("cannot change 'record' field");

        res = await client.patch(`/stream/${stream.id}/record`, {
          record: false,
        });
        expect(res.status).toBe(400);
        json = await res.json();
        expect(json.errors[0]).toContain("cannot change 'record' field");
      });

      it("should disallow changing profiles when steam is active", async () => {
        const stream = await createAndActivateStream();

        let res = await client.patch(`/stream/${stream.id}`, {
          profiles: [],
        });
        expect(res.status).toBe(400);
        let json = await res.json();
        expect(json.errors[0]).toContain("cannot change 'profiles' field");
      });
    });

    describe("stream patch", () => {
      let msTarget: MultistreamTarget;
      let stream: Stream;
      let patchPath: string;

      beforeEach(async () => {
        msTarget = await server.db.multistreamTarget.fillAndCreate({
          ...mockTarget,
          userId: adminUser.id,
        });
        const res = await client.post("/stream", postMockStream);
        stream = await res.json();
        patchPath = `/stream/${stream.id}`;
      });

      it("should disallow patching other users streams", async () => {
        client.jwtAuth = nonAdminToken;
        const res = await client.patch(patchPath, {});
        expect(res.status).toBe(404);
      });

      it("should allow an empty patch", async () => {
        let res = await client.patch(patchPath, {});
        expect(res.status).toBe(204);

        res = await client.patch(patchPath, {});
        expect(res.status).toBe(204);
      });

      it("should allow patch of creator ID", async () => {
        const res = await client.patch(patchPath, {
          creatorId: "0xjest",
        });
        expect(res.status).toBe(204);

        await expect(db.stream.get(stream.id)).resolves.toMatchObject({
          creatorId: { type: "unverified", value: "0xjest" },
        });
      });

      it("should allow patch of playbackPolicy", async () => {
        const res = await client.patch(patchPath, {
          playbackPolicy: {
            type: "public",
          },
        });
        expect(res.status).toBe(204);
      });
      it("should disallow lit playbackPolicy on streams", async () => {
        const res = await client.patch(patchPath, {
          playbackPolicy: {
            type: "lit_signing_condition",
          },
        });
        expect(res.status).toBe(400);
      });

      it("should disallow additional fields", async () => {
        const res = await client.patch(patchPath, {
          name: "the stream name is immutable",
        });
        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.errors[0]).toContain("additionalProperties");
      });

      it("should validate field types", async () => {
        const testTypeErr = async (payload: any) => {
          let res = await client.patch(patchPath, payload);
          expect(res.status).toBe(422);
          const json = await res.json();
          expect(json.errors[0]).toContain(`"type"`);
        };

        await testTypeErr({ record: "true" });
        await testTypeErr({ suspended: "not even a boolean string" });
        await testTypeErr({
          multistream: { targets: { profile: "a", id: "b" } },
        });
        await testTypeErr({ multistream: { targets: [{ profile: 123 }] } });
      });

      it("should validate url format", async () => {
        let res = await client.patch(patchPath, {
          multistream: {
            targets: [
              {
                profile: "test_stream_360p",
                spec: { url: "rtmps://almost.url.but@" },
              },
            ],
          },
        });
        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.errors[0]).toContain("Bad URL");
      });

      it("should reject references to other users multistream targets", async () => {
        const nonAdminTarget = await server.db.multistreamTarget.fillAndCreate({
          ...mockTarget,
          userId: nonAdminUser.id,
        });
        const res = await client.patch(patchPath, {
          multistream: {
            targets: [{ profile: "test_stream_360p", id: nonAdminTarget.id }],
          },
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(`multistream target not found`);
      });

      const testPatchField = async (patch: StreamPatchPayload) => {
        const res = await client.patch(patchPath, patch);
        expect(res.status).toBe(204);

        let patched = await server.db.stream.get(stream.id);
        patched = server.db.stream.addDefaultFields(patched);
        expect(patched).not.toEqual(stream);
        expect(patched).toEqual({ ...stream, ...patch });
      };

      it("should patch record field", async () => {
        await testPatchField({ record: true });
      });

      it("should patch profiles field", async () => {
        await testPatchField({ profiles: [] });
      });

      it("should patch suspended field", async () => {
        await testPatchField({ suspended: true });
      });
      it("should patch multistream targets", async () => {
        await testPatchField({
          multistream: {
            targets: [{ profile: "test_stream_360p", id: msTarget.id }],
          },
        });
      });
      it("should also create inline msTargets", async () => {
        const res = await client.patch(patchPath, {
          multistream: {
            targets: [{ profile: "test_stream_360p", spec: mockTarget }],
          },
        });
        expect(res.status).toBe(204);

        let patched = await server.db.stream.get(stream.id);
        patched = server.db.stream.addDefaultFields(patched);
        const createdPtId = patched.multistream.targets[0].id;
        expect(patched).toEqual({
          ...stream,
          multistream: {
            targets: [{ profile: "test_stream_360p", id: createdPtId }],
          },
        });

        const savedPt = await server.db.multistreamTarget.get(createdPtId);
        expect(savedPt.userId).toEqual(adminUser.id);
      });
    });

    it("should get own streams with non-admin user", async () => {
      const source = [];
      for (let i = 0; i < 9; i += 1) {
        const document = {
          id: i + uuid(), // sort objects
          kind: "stream",
          userId: i < 7 ? nonAdminUser.id : undefined,
          deleted: i < 3 ? true : undefined,
        };
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        expect(res.status).toBe(200);
        source.push(await res.json());
      }
      client.jwtAuth = nonAdminToken;

      const res = await client.get(`/stream/user/${nonAdminUser.id}?limit=3`);
      expect(res.status).toBe(200);
      const streams = await res.json();
      expect(streams.length).toEqual(3);
      expect(streams[0]).toEqual(source[3]);
      expect(streams[0].userId).toEqual(nonAdminUser.id);
      expect(res.headers.raw().link).toBeDefined();
      expect(res.headers.raw().link.length).toBe(1);
      const [nextLink] = res.headers.raw().link[0].split(">");
      const si = nextLink.indexOf(`/stream/user/`);
      const nextRes = await client.get(nextLink.slice(si));
      expect(nextRes.status).toBe(200);
      const nextStreams = await nextRes.json();
      expect(nextStreams.length).toEqual(1);
      expect(nextStreams[0]).toEqual(source[6]);
      expect(nextStreams[0].userId).toEqual(nonAdminUser.id);
    });

    it("should not get streams with non-admin user", async () => {
      for (let i = 0; i < 5; i += 1) {
        const document = {
          id: uuid(),
          kind: "stream",
          userId: i < 3 ? nonAdminUser.id : undefined,
        };
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        expect(res.status).toBe(200);
      }
      client.jwtAuth = nonAdminToken;

      const res = await client.get(`/stream`);
      expect(res.status).toBe(200);
      const streams = await res.json();
      expect(Array.isArray(streams)).toBe(true);
      expect(streams).toHaveLength(3);
      expect(streams[0].userId).toBe(nonAdminUser.id);
    });

    it("should not accept empty body for creating a stream", async () => {
      const res = await client.post("/stream", null);
      expect(res.status).toBe(422);
    });

    it("should not accept additional properties for creating a stream", async () => {
      const postMockLivepeerStream = JSON.parse(JSON.stringify(postMockStream));
      postMockLivepeerStream.livepeer = "livepeer";
      const res = await client.post("/stream", { ...postMockLivepeerStream });
      expect(res.status).toBe(422);
      const stream = await res.json();
      expect(stream.id).toBeUndefined();
    });
  });

  describe("stream endpoint with api key", () => {
    beforeEach(async () => {
      for (let i = 0; i < 5; i += 1) {
        const document = {
          id: uuid(),
          kind: "stream",
          userId: i < 3 ? nonAdminUser.id : undefined,
        };
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        expect(res.status).toBe(200);
      }
      client.jwtAuth = "";
    });

    it("should get own streams", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get(`/stream/user/${nonAdminUser.id}`);
      expect(res.status).toBe(200);
      const streams = await res.json();
      expect(streams.length).toEqual(3);
      expect(streams[0].userId).toEqual(nonAdminUser.id);
    });

    it("should delete stream", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get(`/stream/user/${nonAdminUser.id}`);
      expect(res.status).toBe(200);
      const streams = await res.json();
      expect(streams.length).toEqual(3);
      expect(streams[0].userId).toEqual(nonAdminUser.id);
      let dres = await client.delete(`/stream/${streams[0].id}`);
      expect(dres.status).toBe(204);
      let get2 = await client.delete(`/stream/${streams[0].id}`);
      expect(get2.status).toBe(404);
      let res2 = await client.get(`/stream/user/${nonAdminUser.id}`);
      expect(res2.status).toBe(200);
      const streams2 = await res2.json();
      expect(streams2.length).toEqual(2);
    });

    it("should not get others streams", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get(`/stream/user/otherUserId`);
      expect(res.status).toBe(403);
    });
  });

  describe("webhooks", () => {
    let stream: Stream;
    let data;
    let res;

    beforeEach(async () => {
      const id = uuid();
      stream = {
        id,
        playbackId: await generateUniquePlaybackId(id),
        kind: "stream",
        name: "the-stream",
        userId: nonAdminUser.id,
        presets: ["P720p30fps16x9", "P360p30fps4x3", "P144p30fps16x9"],
        objectStoreId: mockStore.id,
      };
      await server.store.create(stream);
    });

    describe("auth webhook", () => {
      const happyCases = [
        `rtmp://56.13.68.32/live/STREAM_ID`,
        `http://localhost/live/STREAM_ID/12354.ts`,
        `https://example.com/live/STREAM_ID/0.ts`,
        `/live/STREAM_ID/99912938429430820984294083.ts`,
      ];

      for (let url of happyCases) {
        it(`should succeed for ${url}`, async () => {
          url = url.replace("STREAM_ID", stream.id);
          res = await client.post("/stream/hook", { url });
          expect(res.status).toBe(200);
          data = await res.json();
          expect(data.presets).toEqual(stream.presets);
          expect(data.objectStore).toEqual(mockStore.url);
        });
      }

      const sadCases: [number, string][] = [
        [422, `rtmp://localhost/live/foo/bar/extra`],
        [422, `http://localhost/live/foo/bar/extra/extra2/13984.ts`],
        [422, "nonsense://localhost/live"],
        [401, `https://localhost/live`],
        [404, `https://localhost/notlive/STREAM_ID/1324.ts`],
        [404, `rtmp://localhost/notlive/STREAM_ID`],
        [404, `rtmp://localhost/live/nonexists`],
        [404, `https://localhost/live/notexists/1324.ts`],
      ];

      for (let [status, url] of sadCases) {
        it(`should return ${status} for ${url}`, async () => {
          url = url.replace("STREAM_ID", stream.id);
          res = await client.post("/stream/hook", { url });
          expect(res.status).toBe(status);
        });
      }

      it("should reject missing urls", async () => {
        res = await client.post("/stream/hook", {});
        expect(res.status).toBe(422);
      });

      describe("authorization", () => {
        let url: string;

        beforeEach(() => {
          url = happyCases[0].replace("STREAM_ID", stream.id);
        });

        it("should not accept non-admin users", async () => {
          client.jwtAuth = nonAdminToken;
          res = await client.post("/stream/hook", { url });
          expect(res.status).toBe(403);
          data = await res.json();
          expect(data.errors[0]).toContain("admin");
        });

        const testBasic = async (
          userPassword: string,
          statusCode: number,
          error?: string
        ) => {
          client.jwtAuth = undefined;
          client.basicAuth = userPassword;
          res = await client.post("/stream/hook", { url });
          expect(res.status).toBe(statusCode);
          if (error) {
            data = await res.json();
            expect(data.errors[0]).toEqual(error);
          }
        };

        it("should parse basic auth", async () => {
          await testBasic("hey:basic", 401, "no token basic found");
        });

        it("should accept valid token in basic auth", async () => {
          await testBasic(`${adminUser.id}:${adminApiKey}`, 200);
        });

        it("should only accept token with corresponding user id", async () => {
          await testBasic(
            `${nonAdminUser.id}:${adminApiKey}`,
            401,
            expect.stringMatching(/no token .+ found/)
          );
        });

        it("should still only accept admin users", async () => {
          await testBasic(
            `${nonAdminUser.id}:${nonAdminApiKey}`,
            403,
            expect.stringContaining("admin")
          );
        });
      });
    });

    describe("stream health hook", () => {
      let stream: Stream;

      const samplePayload = (isActive: boolean, isHealthy: boolean) => ({
        stream_name: "video+" + stream.playbackId,
        session_id: "sampleSessionId",
        is_active: isActive,
        is_healthy: isHealthy,
        tracks: {
          track1: {
            codec: "h264",
            kbits: 1000,
            keys: { frames_min: 142, frames_max: 420 },
            fpks: 30,
            height: 720,
            width: 1280,
          },
        },
        extra: { jitter: 123 },
        issues: isHealthy ? undefined : "Some complex error message",
        human_issues: isHealthy ? undefined : ["Under the weather"],
      });

      const sendStreamHealthHook = async (payload: StreamHealthPayload) => {
        const res = await client.post("/stream/hook/health", payload);
        expect(res.status).toBe(204);
        const stream = await server.db.stream.getByPlaybackId(
          payload.stream_name.split("+", 2)[1]
        );
        return stream;
      };

      beforeEach(async () => {
        // Create a sample stream
        client.jwtAuth = null;
        client.apiKey = adminApiKey;
        const res = await client.post("/stream", {
          ...postMockStream,
          name: "videorec+samplePlaybackId",
        });
        expect(res.status).toBe(201);
        stream = await res.json();
        expect(stream.id).toBeDefined();
      });

      it("updates the stream's isHealthy and issues fields", async () => {
        const payload = samplePayload(true, false);
        const updatedStream = await sendStreamHealthHook(payload);

        expect(updatedStream.isHealthy).toBe(false);
        // it should send the human issues to the stream issues field
        expect(updatedStream.issues).toEqual(["Under the weather"]);
      });

      it("resets the issues field when the stream becomes healthy", async () => {
        let payload = samplePayload(true, false);
        await sendStreamHealthHook(payload);

        payload = samplePayload(true, true);
        const updatedStream = await sendStreamHealthHook(payload);

        expect(updatedStream.isHealthy).toBe(true);
        if (updatedStream.issues) {
          expect(updatedStream.issues.length).toEqual(0);
        } else {
          expect(updatedStream.issues).toBeNull();
        }
      });

      it("clears stream's isHealthy and issues fields when is_active is false", async () => {
        let payload = samplePayload(true, false);
        await sendStreamHealthHook(payload);

        payload = samplePayload(false, false);
        const updatedStream = await sendStreamHealthHook(payload);

        expect(updatedStream.isHealthy).toBeNull();
        if (updatedStream.issues) {
          expect(updatedStream.issues.length).toEqual(0);
        } else {
          expect(updatedStream.issues).toBeNull();
        }
      });

      it("updates the stream's lastSeen field", async () => {
        const timeBeforeUpdate = Date.now();
        const payload = samplePayload(true, true);
        const updatedStream = await sendStreamHealthHook(payload);

        expect(updatedStream.lastSeen).toBeGreaterThan(timeBeforeUpdate);
      });

      it("updates the session as well when it exists", async () => {
        const payload = samplePayload(true, false);

        // Create a sample session associated with the stream
        const session = {
          id: payload.session_id,
          name: payload.stream_name,
          streamId: stream.id,
          lastSeen: Date.now(),
        };
        await db.session.create(session);

        // Send a stream health hook payload
        await sendStreamHealthHook(payload);

        // Check if the session is updated as well
        const updatedSession = await db.session.get("sampleSessionId");
        expect(updatedSession.isHealthy).toBe(false);
        expect(updatedSession.issues).toEqual(["Under the weather"]);
        expect(updatedSession.lastSeen).toBeGreaterThan(session.lastSeen);
      });

      it("throws a NotFoundError when the stream is not found", async () => {
        const payload = {
          ...samplePayload(true, true),
          stream_name: "videorec+nonexistentPlaybackId",
        };
        const res = await client.post("/stream/hook/health", payload);

        expect(res.status).toBe(404);
        await expect(res.json()).resolves.toMatchObject({
          errors: [expect.stringContaining("stream not found")],
        });
      });
    });

    describe("detection webhook", () => {
      it("should return an error if no manifest ID provided", async () => {
        res = await client.post("/stream/hook/detection", {});
        expect(res.status).toBe(422);
        data = await res.json();
        expect(data.errors[0]).toContain(`\"required\"`);
      });

      it("should return an error if stream doesn't exist", async () => {
        const id = uuid();
        res = await client.post("/stream/hook/detection", {
          manifestID: id,
          seqNo: 1,
          sceneClassification: [],
        });
        expect(res.status).toBe(404);
        data = await res.json();
        expect(data.errors[0]).toEqual("stream not found");
      });

      it("should allow for content detection on ids instead of playbackIds", async () => {
        res = await client.post("/stream/hook/detection", {
          manifestID: stream.id,
          seqNo: 1,
          sceneClassification: [],
        });
        expect(res.status).toBe(204);
      });

      it("should only accept a scene classification array", async () => {
        res = await client.post("/stream/hook/detection", {
          manifestID: "-",
          seqNo: 1,
          sceneClassification: { shouldBe: "array" },
        });
        expect(res.status).toBe(422);
        data = await res.json();
        expect(data.errors[0]).toContain(`\"type\"`);
      });

      describe("emitted event", () => {
        let webhookServer: AuxTestServer;
        let hookSem: ReturnType<typeof semaphore>;
        let hookPayload: any;
        let genMockWebhook: () => DBWebhook;

        beforeAll(async () => {
          webhookServer = await startAuxTestServer();
          webhookServer.app.use(bodyParserJson());
          webhookServer.app.post(
            "/captain/hook",
            bodyParserJson(),
            (req, res) => {
              hookPayload = req.body;
              hookSem.release();
              res.status(204).end();
            }
          );
          genMockWebhook = () => ({
            id: uuid(),
            userId: nonAdminUser.id,
            name: "detection-webhook",
            kind: "webhook",
            createdAt: Date.now(),
            events: ["stream.detection"],
            url: `http://localhost:${webhookServer.port}/captain/hook`,
          });
        });

        afterAll(() => webhookServer.close());

        beforeEach(async () => {
          hookSem = semaphore();
          hookPayload = undefined;

          client.jwtAuth = nonAdminToken;
          const res = await client.post("/stream", postMockStream);
          expect(res.status).toBe(201);
          stream = await res.json();
          // Hooks can only be called by admin users
          client.jwtAuth = adminToken;
        });

        it("should return success if no webhook registered", async () => {
          res = await client.post("/stream/hook/detection", {
            manifestID: stream.playbackId,
            seqNo: 1,
            sceneClassification: [],
          });
          expect(res.status).toBe(204);
        });

        it("should propagate event to registered webhook", async () => {
          const sceneClassification = [
            { name: "soccer", probability: 0.7 },
            { name: "adult", probability: 0.68 },
          ];
          const webhookObj = await server.db.webhook.create(genMockWebhook());
          const now = Date.now();
          res = await client.post("/stream/hook/detection", {
            manifestID: stream.playbackId,
            seqNo: 1,
            sceneClassification,
          });
          expect(res.status).toBe(204);

          await hookSem.wait(3000);
          expect(hookPayload).toBeDefined();
          expect(hookPayload.createdAt).toBeGreaterThanOrEqual(now);
          expect(hookPayload.timestamp).toBeGreaterThanOrEqual(now);
          delete hookPayload.createdAt;
          delete hookPayload.timestamp;
          expect(hookPayload).toEqual({
            id: expect.stringMatching(uuidRegex),
            webhookId: webhookObj.id,
            event: "stream.detection",
            stream: { ...stream, streamKey: undefined },
            payload: { sceneClassification, seqNo: 1 },
          });
        });
      });
    });
  });

  describe("profiles", () => {
    let stream: Stream;
    let fractionalStream: Stream;
    let gopStream: Stream;
    let profileStream: Stream;

    beforeEach(async () => {
      client.jwtAuth = nonAdminToken;

      stream = {
        name: "test stream",
        profiles: [
          {
            name: "1080p",
            bitrate: 6000000,
            fps: 30,
            width: 1920,
            height: 1080,
          },
          {
            name: "720p",
            bitrate: 2000000,
            fps: 30,
            width: 1280,
            height: 720,
          },
          {
            name: "360p",
            bitrate: 500000,
            fps: 30,
            width: 640,
            height: 360,
          },
        ],
      };
      fractionalStream = {
        ...stream,
        profiles: [
          {
            name: "1080p29.97",
            bitrate: 6000000,
            fps: 30000,
            fpsDen: 1001,
            width: 1920,
            height: 1080,
          },
        ],
      };
      gopStream = {
        ...stream,
        profiles: [
          {
            ...stream.profiles[0],
            gop: "2.0",
          },
          {
            ...stream.profiles[1],
            gop: "0",
          },
          {
            ...stream.profiles[2],
            gop: "intra",
          },
        ],
      };

      profileStream = {
        ...stream,
        profiles: [
          {
            ...stream.profiles[0],
            profile: "H264Baseline",
          },
          {
            ...stream.profiles[1],
            profile: "H264High",
          },
          {
            ...stream.profiles[2],
            profile: "H264ConstrainedHigh",
          },
        ],
      };
    });

    it("should handle profiles, including fractional fps, gops, and h264 profiles", async () => {
      for (const testStream of [
        stream,
        fractionalStream,
        gopStream,
        profileStream,
      ]) {
        const res = await client.post("/stream", testStream);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.profiles).toEqual(testStream.profiles);
        client.jwtAuth = adminToken;
        const hookRes = await client.post("/stream/hook", {
          url: `https://example.com/live/${data.id}/0.ts`,
        });
        expect(hookRes.status).toBe(200);
        const hookData = await hookRes.json();
        expect(hookData.profiles).toEqual(
          testStream.profiles.map((profile) => {
            return {
              profile: "H264ConstrainedHigh",
              ...profile,
            };
          })
        );
      }
    });

    it("should set default profiles if none provided", async () => {
      const res = await client.post("/stream", {
        ...stream,
        profiles: undefined,
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as DBStream;
      expect(data.profiles).not.toEqual(stream.profiles);
      expect(data.profiles.map((p) => p.name).sort()).toEqual([
        "240p0",
        "360p0",
        "480p0",
        "720p0",
      ]);
    });

    it("should reject profiles we do not have", async () => {
      const badStream = {
        ...profileStream,
        profiles: [...profileStream.profiles],
      };
      badStream.profiles[0] = {
        ...profileStream.profiles[0],
        profile: "VP8OrSomethingIDK" as any,
      };
      const res = await client.post("/stream", badStream);
      expect(res.status).toBe(422);
    });
  });

  describe("user sessions", () => {
    it("should join sessions", async () => {
      // create parent stream
      let res = await client.post(`/stream`, smallStream);
      expect(res.status).toBe(201);
      const parent = await res.json();
      expect(parent.record).toEqual(true);
      // create child stream
      const sessionId = "181cb15c-7c4c-424c-9216-eb94f6870325";
      res = await client.post(
        `/stream/${parent.id}/stream?sessionId=${sessionId}`,
        {
          ...smallStream,
          name: "stream1",
        }
      );
      expect(res.status).toBe(201);
      let stream1 = await res.json();
      expect(stream1.record).toEqual(true);
      expect(stream1.parentId).toEqual(parent.id);
      expect(stream1.sessionId).toEqual(sessionId);
      // add some usage and lastSeen
      const data = {
        lastSeen: Date.now(),
        sourceBytes: 1,
        transcodedBytes: 2,
        sourceSegments: 3,
        transcodedSegments: 4,
        sourceSegmentsDuration: 1.5,
        transcodedSegmentsDuration: 2.5,
        recordObjectStoreId: "mock_store",
      };
      await server.db.stream.update(stream1.id, data);
      await server.db.session.update(sessionId, data);
      await db.asset.create({
        id: sessionId,
        playbackId: "playback_id",
        source: { type: "recording", sessionId: sessionId },
        status: { phase: "ready", updatedAt: Date.now() },
        name: `live-12345`,
        objectStoreId: "mock_store",
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

      res = await client.get(`/stream/${stream1.id}`);
      expect(res.status).toBe(200);
      stream1 = await res.json();
      expect(stream1.parentId).toEqual(parent.id);
      expect(stream1.name).toEqual("stream1");
      expect(stream1.transcodedSegments).toEqual(4);

      // get user sessions
      res = await client.get(`/stream/${parent.id}/sessions`);
      expect(res.status).toBe(200);
      let sessions = await res.json();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toEqual(sessionId);
      expect(sessions[0].transcodedSegments).toEqual(4);

      // create second stream re-using the same session
      res = await client.post(
        `/stream/${parent.id}/stream?sessionId=${sessionId}`,
        {
          ...smallStream,
          name: "stream2",
        }
      );
      expect(res.status).toBe(201);
      let stream2 = await res.json();
      expect(stream2.record).toEqual(true);
      expect(stream2.parentId).toEqual(parent.id);
      expect(stream2.partialSession).toBeUndefined();
      expect(stream2.previousSessions).toBeUndefined();
      expect(stream2.sessionId).toEqual(sessionId);
      // add some usage and lastSeen
      const data2 = {
        lastSeen: Date.now(),
        sourceBytes: 5,
        transcodedBytes: 6,
        sourceSegments: 7,
        transcodedSegments: 8,
        sourceSegmentsDuration: 8.5,
        transcodedSegmentsDuration: 9.5,
        recordObjectStoreId: "mock_store",
      };
      await server.db.stream.update(stream2.id, data2);
      await server.db.session.update(sessionId, data2);

      res = await client.get(`/stream/${stream2.id}`);
      expect(res.status).toBe(200);
      stream2 = await res.json();
      expect(stream2.name).toEqual("stream2");
      expect(stream2.parentId).toEqual(parent.id);
      expect(stream2.transcodedSegments).toEqual(8);
      expect(stream2.partialSession).toBeUndefined();
      expect(stream2.previousSessions).toBeUndefined();
      expect(stream2.previousStats).toBeUndefined();

      // get raw second stream, which should also not show any join
      res = await client.get(`/stream/${stream2.id}?raw=1`);
      expect(res.status).toBe(200);
      let stream2r = await res.json();
      expect(stream2r.record).toEqual(true);
      expect(stream2r.parentId).toEqual(parent.id);
      expect(stream2r.previousStats).toBeUndefined();

      await sleep(20);

      res = await client.get(`/stream/${stream1.id}?raw=1`);
      expect(res.status).toBe(200);
      let stream1r = await res.json();
      expect(stream1r.lastSeen).toEqual(stream1.lastSeen);
      expect(stream1r.lastSessionId).toBeUndefined();
      expect(stream1r.partialSession).toBeUndefined();

      res = await client.get(`/stream/${stream1.id}`);
      expect(res.status).toBe(200);
      let stream1n = await res.json();
      expect(stream1n.lastSessionId).toBeUndefined();
      expect(stream1n.createdAt).toEqual(stream1r.createdAt);
      expect(stream1n.lastSeen).toEqual(stream1r.lastSeen);
      expect(stream1n.previousStats).toBeUndefined();
      // sourceSegments should equal to only the first session data
      expect(stream1n.sourceSegments).toEqual(3);

      // get user sessions
      res = await client.get(`/stream/${parent.id}/sessions?forceUrl=1`);
      expect(res.status).toBe(200);
      sessions = await res.json();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toEqual(sessionId);
      expect(sessions[0].recordingUrl).toEqual(
        "http://example-public/playback_id/output.m3u8"
      );
      expect(sessions[0].mp4Url).toEqual(
        "http://example-public/playback_id/output.mp4"
      );
    });
  });
});

const smallStream = {
  name: "small01",
  record: true,
  profiles: [
    {
      fps: 0,
      name: "240p0",
      width: 426,
      height: 240,
      bitrate: 250000,
    },
  ],
};
