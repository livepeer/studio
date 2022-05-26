jest.mock("./generate-keys");
// @ts-ignore: mocked funcs
import { __addResult, __failOnMissingResult, __reset } from "./generate-keys";
const keysMock = { __addResult, __failOnMissingResult, __reset };
// actual module under test
import { generateUniquePlaybackId } from "./generate-keys";

import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { Asset, User } from "../schema/types";
import { db } from "../store";
import { DBStream } from "../store/stream-table";
import { WithID } from "../store/types";

const mockPlaybackId = "fiz5a3ztdbnothft";
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

describe("controllers/generate-keys", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;

  let asset1: WithID<Asset>;
  let asset2: WithID<Asset>;
  let stream1: DBStream;
  let stream2: DBStream;

  const createAsset = async (name: string) => {
    const res = await client.post("/asset/request-upload", { name });
    expect(res.status).toBe(200);
    const { asset } = await res.json();
    return asset;
  };

  const createStream = async (name: string) => {
    const res = await client.post("/stream", { name });
    expect(res.status).toBe(201);
    return res.json();
  };

  beforeEach(async () => {
    await db.objectStore.create({
      id: "mock_vod_store",
      url: "http://user:password@localhost:8080/us-east-1/vod",
    });
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;

    asset1 = await createAsset("asset1");
    asset2 = await createAsset("asset2");
    stream1 = await createStream("stream1");
    stream2 = await createStream("stream2");

    keysMock.__failOnMissingResult();
  });

  afterEach(() => {
    keysMock.__reset();
  });

  it("should generate playback IDs with the mocked values", async () => {
    keysMock.__addResult(mockPlaybackId);
    const res = await client.post("/asset/request-upload", { name: "zoo" });
    expect(res.status).toBe(200);
    const { asset } = await res.json();
    // due to sharding we need to skip the first 4 chars
    expect(asset.playbackId.slice(4)).toEqual(mockPlaybackId.slice(4));
  });

  it("should skip existing asset playback IDs", async () => {
    keysMock.__addResult(asset1.playbackId, asset2.playbackId, mockPlaybackId);
    const pid = await generateUniquePlaybackId("");
    expect(pid).not.toEqual(asset1.playbackId);
    expect(pid).not.toEqual(asset2.playbackId);
    expect(pid).toEqual(mockPlaybackId);
  });

  it("should skip existing stream playback IDs", async () => {
    keysMock.__addResult(
      stream1.playbackId,
      stream2.playbackId,
      mockPlaybackId
    );
    const pid = await generateUniquePlaybackId("");
    expect(pid).not.toEqual(stream1.playbackId);
    expect(pid).not.toEqual(stream2.playbackId);
    expect(pid).toEqual(mockPlaybackId);
  });

  it("should skip existing stream keys", async () => {
    keysMock.__addResult(stream1.streamKey, stream2.streamKey, mockPlaybackId);
    const pid = await generateUniquePlaybackId("");
    expect(pid).not.toEqual(stream1.streamKey);
    expect(pid).not.toEqual(stream2.streamKey);
    expect(pid).toEqual(mockPlaybackId);
  });

  it("should skip all conflicts at once", async () => {
    keysMock.__addResult(
      asset1.playbackId,
      stream1.streamKey,
      asset2.playbackId,
      stream2.playbackId,
      stream1.playbackId,
      stream2.streamKey,
      mockPlaybackId
    );
    await expect(generateUniquePlaybackId("")).resolves.toEqual(mockPlaybackId);
  });
});
