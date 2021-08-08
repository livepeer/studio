import { json as bodyParserJson } from "body-parser";
import { v4 as uuid } from "uuid";

import {
  ObjectStore,
  PushTarget,
  Stream,
  StreamPatchPayload,
  User,
} from "../schema/types";
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

const uuidRegex = /[0-9a-f]+(-[0-9a-f]+){4}/;

let server: TestServer;
let mockStore: ObjectStore & { kind: string };
let mockPushTarget: PushTarget;
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
    userId: mockAdminUser.id,
    kind: "object-store",
  };

  mockPushTarget = {
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
    it("should not get all streams without admin authorization", async () => {
      client.jwtAuth = "";
      for (let i = 0; i < 10; i += 1) {
        const document = {
          id: uuid(),
          kind: "stream",
        };
        await server.store.create(document);
        const res = await client.get(`/stream/${document.id}`);
        expect(res.status).toBe(403);
      }
      const res = await client.get("/stream");
      expect(res.status).toBe(403);
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
      const res = await client.post("/stream", { ...postMockStream });
      expect(res.status).toBe(400);
    });

    describe("stream creation validation", () => {
      let pushTarget: PushTarget;

      beforeEach(async () => {
        await server.store.create(mockStore);
        pushTarget = await server.db.pushTarget.fillAndCreate({
          ...mockPushTarget,
          userId: adminUser.id,
        });
      });

      it("should reject push targets without a profile", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [{ id: pushTarget.id }],
        });
        expect(res.status).toBe(422);
      });

      it("should reject push targets referencing an inexistent profile", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [{ profile: "hello", id: pushTarget.id }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain("must reference existing profile");
      });

      it("should reject push targets with an invalid spec", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [
            {
              profile: "test_stream_360p",
              spec: { name: "this actually needed a url" },
            },
          ],
        });
        expect(res.status).toBe(422);
      });

      it("should reject push targets without an id or spec", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [{ profile: "test_stream_360p" }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(
          `must have either an "id" or a "spec"`
        );
      });

      it("should reject push targets with both an id and a spec", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [
            {
              profile: "test_stream_360p",
              id: pushTarget.id,
              spec: mockPushTarget,
            },
          ],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(
          `must have either an "id" or a "spec"`
        );
      });

      it("should reject references to other users push targets", async () => {
        client.jwtAuth = nonAdminToken;
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [{ profile: "test_stream_360p", id: pushTarget.id }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(`push target not found`);
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
      let pushTarget: PushTarget;

      beforeEach(async () => {
        await server.store.create(mockStore);
        pushTarget = await server.db.pushTarget.fillAndCreate({
          ...mockPushTarget,
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

      it("should create stream with valid push target ID", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [{ profile: "test_stream_360p", id: pushTarget.id }],
        });
        expect(res.status).toBe(201);
      });

      it("should create stream with valid detection config", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          detection: { sceneClassification: [{ name: "soccer" }] },
        });
        expect(res.status).toBe(201);
      });

      it("should create stream with inline push target", async () => {
        const res = await client.post("/stream", {
          ...postMockStream,
          pushTargets: [{ profile: "test_stream_360p", spec: mockPushTarget }],
        });
        expect(res.status).toBe(201);
        const created = await res.json();
        const resultPt = created.pushTargets[0];
        expect(resultPt.profile).toEqual("test_stream_360p");
        expect(resultPt.spec).toBeUndefined();
        expect(resultPt.id).toBeDefined();
        expect(resultPt.id).not.toEqual(pushTarget.id);

        const saved = await server.db.pushTarget.get(resultPt.id);
        expect(saved).toBeDefined();
        expect(saved.userId).toEqual(adminUser.id);
      });
    });

    it("should create a stream, delete it, and error when attempting additional detele or replace", async () => {
      await server.store.create(mockStore);
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

    describe("stream patch", () => {
      let pushTarget: PushTarget;
      let stream: Stream;
      let patchPath: string;

      beforeEach(async () => {
        await server.store.create(mockStore);
        pushTarget = await server.db.pushTarget.fillAndCreate({
          ...mockPushTarget,
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
        await testTypeErr({ pushTargets: { profile: "a", id: "b" } });
        await testTypeErr({ pushTargets: [{ profile: 123 }] });
      });

      it("should validate url format", async () => {
        let res = await client.patch(patchPath, {
          pushTargets: [
            {
              profile: "test_stream_360p",
              spec: { url: "rtmps://almost.url.but@" },
            },
          ],
        });
        expect(res.status).toBe(422);
        const json = await res.json();
        expect(json.errors[0]).toContain("Bad URL");
      });

      it("should reject references to other users push targets", async () => {
        const nonAdminTarget = await server.db.pushTarget.fillAndCreate({
          ...mockPushTarget,
          userId: nonAdminUser.id,
        });
        const res = await client.patch(patchPath, {
          pushTargets: [{ profile: "test_stream_360p", id: nonAdminTarget.id }],
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.errors[0]).toContain(`push target not found`);
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
      it("should patch suspended field", async () => {
        await testPatchField({ suspended: true });
      });
      it("should patch pushTargets", async () => {
        await testPatchField({
          pushTargets: [{ profile: "test_stream_360p", id: pushTarget.id }],
        });
      });
      it("should also create inline pushTargets", async () => {
        const res = await client.patch(patchPath, {
          pushTargets: [{ profile: "test_stream_360p", spec: mockPushTarget }],
        });
        expect(res.status).toBe(204);

        let patched = await server.db.stream.get(stream.id);
        patched = server.db.stream.addDefaultFields(patched);
        const createdPtId = patched.pushTargets[0].id;
        expect(patched).toEqual({
          ...stream,
          pushTargets: [{ profile: "test_stream_360p", id: createdPtId }],
        });

        const savedPt = await server.db.pushTarget.get(createdPtId);
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
      await server.store.create(mockStore);
      stream = {
        id: uuid(),
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

      describe("detection config", () => {
        const url = (id: string) => happyCases[0].replace("STREAM_ID", id);
        const defaultDetection = {
          freq: 4,
          sampleRate: 10,
          sceneClassification: [{ name: "soccer" }, { name: "adult" }],
        };

        it("should not include detection field by default", async () => {
          res = await client.post("/stream/hook", { url: url(stream.id) });
          expect(res.status).toBe(200);
          data = await res.json();
          expect(data.detection).toBeUndefined();
        });

        it("should return default detection if subscribed webhook exists", async () => {
          await server.db.webhook.create({
            id: uuid(),
            kind: "webhook",
            name: "zoo.tv",
            events: ["stream.detection"],
            userId: stream.userId,
            createdAt: Date.now(),
            url: "https://zoo.tv/abuse/hook",
          });

          res = await client.post("/stream/hook", { url: url(stream.id) });
          expect(res.status).toBe(200);
          data = await res.json();
          expect(data.detection).toEqual(defaultDetection);
        });

        it("should return default detection if stream includes it", async () => {
          const id = uuid();
          await server.store.create({ ...stream, id, detection: {} });

          res = await client.post("/stream/hook", { url: url(id) });
          expect(res.status).toBe(200);
          data = await res.json();
          expect(data.detection).toEqual(defaultDetection);
        });

        it("should return stream scene classification config", async () => {
          const id = uuid();
          await server.store.create({
            ...stream,
            id,
            detection: { sceneClassification: [{ name: "adult" }] },
          });

          res = await client.post("/stream/hook", { url: url(id) });
          expect(res.status).toBe(200);
          data = await res.json();
          expect(data.detection).toEqual({
            ...defaultDetection,
            sceneClassification: [{ name: "adult" }],
          });
        });

        it("should disallow configuring sample rates", async () => {
          const id = uuid();
          await server.store.create({
            ...stream,
            id,
            detection: { freq: 1, sampleRate: 9 },
          });

          res = await client.post("/stream/hook", { url: url(id) });
          expect(res.status).toBe(200);
          data = await res.json();
          expect(data.detection).toEqual(defaultDetection);
        });
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
          await testBasic("hey:basic", 403, "no token basic found");
        });

        it("should accept valid token in basic auth", async () => {
          await testBasic(`${adminUser.id}:${adminApiKey}`, 200);
        });

        it("should only accept token with corresponding user id", async () => {
          await testBasic(
            `${nonAdminUser.id}:${adminApiKey}`,
            403,
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

      await server.store.create(mockStore);
      stream = {
        kind: "stream",
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
        expect(hookData.profiles).toEqual(testStream.profiles);
      }
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
      await server.store.create(mockStore);
      // create parent stream
      let res = await client.post("/stream", smallStream);
      expect(res.status).toBe(201);
      const parent = await res.json();
      expect(parent.record).toEqual(true);
      // create session
      res = await client.post(`/stream/${parent.id}/stream`, {
        ...smallStream,
        name: "sess1",
      });
      expect(res.status).toBe(201);
      let sess1 = await res.json();
      expect(sess1.record).toEqual(true);
      expect(sess1.parentId).toEqual(parent.id);
      // add some usage and lastSeen
      let now = Date.now();
      await server.db.stream.update(sess1.id, {
        lastSeen: now,
        sourceBytes: 1,
        transcodedBytes: 2,
        sourceSegments: 3,
        transcodedSegments: 4,
        sourceSegmentsDuration: 1.5,
        transcodedSegmentsDuration: 2.5,
        recordObjectStoreId: "mock_store",
      });
      res = await client.get(`/stream/${sess1.id}`);
      expect(res.status).toBe(200);
      sess1 = await res.json();
      expect(sess1.parentId).toEqual(parent.id);
      expect(sess1.name).toEqual("sess1");
      expect(sess1.transcodedSegments).toEqual(4);

      // get user sessions
      res = await client.get(`/stream/${parent.id}/sessions`);
      expect(res.status).toBe(200);
      let sessions = await res.json();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toEqual(sess1.id);
      expect(sessions[0].transcodedSegments).toEqual(4);
      expect(sessions[0].createdAt).toEqual(sess1.createdAt);

      // create second session
      res = await client.post(`/stream/${parent.id}/stream`, {
        ...smallStream,
        name: "sess2",
      });
      expect(res.status).toBe(201);
      let sess2 = await res.json();
      expect(sess2.record).toEqual(true);
      expect(sess2.parentId).toEqual(parent.id);
      expect(sess2.partialSession).toBeUndefined();
      expect(sess2.previousSessions).toBeUndefined();
      // add some usage and lastSeen
      now = Date.now();
      await server.db.stream.update(sess2.id, {
        lastSeen: now,
        sourceBytes: 5,
        transcodedBytes: 6,
        sourceSegments: 7,
        transcodedSegments: 8,
        sourceSegmentsDuration: 8.5,
        transcodedSegmentsDuration: 9.5,
        recordObjectStoreId: "mock_store",
      });
      res = await client.get(`/stream/${sess2.id}`);
      expect(res.status).toBe(200);
      sess2 = await res.json();
      expect(sess2.name).toEqual("sess2");
      expect(sess2.parentId).toEqual(parent.id);
      expect(sess2.transcodedSegments).toEqual(8);
      expect(sess2.partialSession).toBeUndefined();
      expect(sess2.previousSessions).toBeUndefined();
      expect(sess2.previousStats).toBeUndefined();
      // get raw second session
      res = await client.get(`/stream/${sess2.id}?raw=1`);
      expect(res.status).toBe(200);
      let sess2r = await res.json();
      expect(sess2r.record).toEqual(true);
      expect(sess2r.parentId).toEqual(parent.id);
      expect(sess2r.previousStats).toBeDefined();
      expect(sess2r.previousStats.sourceSegments).toEqual(3);
      await sleep(20);
      res = await client.get(`/stream/${sess1.id}?raw=1`);
      expect(res.status).toBe(200);
      let sess1r = await res.json();
      expect(sess1r.lastSessionId).toEqual(sess2r.id);
      expect(sess1r.partialSession).toEqual(true);

      res = await client.get(`/stream/${sess1.id}`);
      expect(res.status).toBe(200);
      let sess1n = await res.json();
      expect(sess1n.lastSessionId).toBeUndefined();
      expect(sess1n.createdAt).toEqual(sess1r.createdAt);
      expect(sess1n.lastSeen).toEqual(sess2r.lastSeen);
      expect(sess1n.previousStats).toBeUndefined();
      // sourceSegments should equal to sum of both sessions
      expect(sess1n.sourceSegments).toEqual(10);

      // get user sessions
      res = await client.get(`/stream/${parent.id}/sessions?forceUrl=1`);
      expect(res.status).toBe(200);
      sessions = await res.json();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toEqual(sess1r.id);
      expect(sessions[0].transcodedSegments).toEqual(12);
      expect(sessions[0].createdAt).toEqual(sess1r.createdAt);
      expect(sessions[0].recordingUrl).toEqual(
        `https://test/recordings/${sess2r.id}/index.m3u8`
      );
    });
  });
});

const smallStream = {
  id: "231e7a49-8351-400b-a3df-0bcde13754e4",
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
