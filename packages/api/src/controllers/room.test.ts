import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { User } from "../schema/types";
import { db } from "../store";
import { RoomServiceClient } from "livekit-server-sdk";
import { CreateOptions } from "livekit-server-sdk/dist/RoomServiceClient";
jest.mock("livekit-server-sdk");
const MockedRoomServiceClient =
  RoomServiceClient as jest.Mock<RoomServiceClient>;

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

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

describe("controllers/room", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;

  const createStub = jest.fn((options: CreateOptions) => {
    return Promise.resolve();
  });
  beforeEach(async () => {
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;

    MockedRoomServiceClient.mockImplementation(() => {
      return {
        createRoom: createStub,
      };
    });
  });

  describe("room creation", () => {
    it("should create a room", async () => {
      let res = await client.post(`/room`);

      expect(res.status).toBe(201);
      const roomRes = await res.json();
      expect(roomRes.id).toBeDefined();

      expect(createStub).toHaveBeenCalledTimes(1);
      const createOpts = createStub.mock.calls[0][0];
      expect(roomRes.id).toBe(createOpts.name);
    });
  });
});
