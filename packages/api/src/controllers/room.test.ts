import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { User } from "../schema/types";
import { RoomServiceClient } from "livekit-server-sdk";
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

  beforeEach(async () => {
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;
  });

  describe("room creation", () => {
    it("should create a room", async () => {
      let roomServiceClient = new RoomServiceClient("");
      const mockCreateRoom = jest.spyOn(roomServiceClient, "createRoom");
      MockedRoomServiceClient.mockReturnValueOnce(roomServiceClient);
      mockCreateRoom.mockReturnValueOnce(Promise.resolve(undefined));

      let res = await client.post(`/room`);

      expect(res.status).toBe(201);
      const roomRes = await res.json();
      expect(roomRes.id).toBeDefined();

      expect(mockCreateRoom).toHaveBeenCalledTimes(1);
      const createOpts = mockCreateRoom.mock.calls[0][0];
      expect(roomRes.id).toBe(createOpts.name);

      res = await client.get(`/room/${roomRes.id}`);
      expect(res.status).toBe(200);

      const getRoomRes = await res.json();
      expect(getRoomRes.id).toBe(roomRes.id);
      expect(getRoomRes.userId).toBeUndefined();
    });
  });
});
