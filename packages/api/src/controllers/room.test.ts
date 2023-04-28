import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { User } from "../schema/types";
import { EgressClient, RoomServiceClient } from "livekit-server-sdk";
jest.mock("livekit-server-sdk");
const MockedRoomServiceClient =
  RoomServiceClient as jest.Mock<RoomServiceClient>;
const MockedEgressClient = EgressClient as jest.Mock<EgressClient>;

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
  let roomServiceClient;
  let mockCreateRoom: jest.SpyInstance;
  let egressClient;

  beforeEach(async () => {
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;

    roomServiceClient = new RoomServiceClient("");
    egressClient = new EgressClient("");

    MockedRoomServiceClient.mockReturnValue(roomServiceClient);
    mockCreateRoom = jest.spyOn(roomServiceClient, "createRoom");
    mockCreateRoom.mockReturnValueOnce(Promise.resolve(undefined));
    MockedEgressClient.mockReturnValue(egressClient);
  });

  describe("room creation", () => {
    it("should create and delete rooms", async () => {
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

      const mockDeleteRoom = jest.spyOn(roomServiceClient, "deleteRoom");
      res = await client.delete(`/room/${roomRes.id}`);
      expect(res.status).toBe(204);
      expect(mockDeleteRoom).toHaveBeenCalledTimes(1);
      expect(mockDeleteRoom.mock.calls[0][0]).toBe(roomRes.id);

      // should no longer exist
      res = await client.get(`/room/${roomRes.id}`);
      expect(res.status).toBe(404);
    });

    it("should add and remove participants", async () => {
      let res = await client.post(`/room`);
      expect(res.status).toBe(201);
      const roomRes = await res.json();
      expect(roomRes.id).toBeDefined();

      res = await client.post(`/room/${roomRes.id}/user`, {
        name: "display name",
      });
      expect(res.status).toBe(201);
      const resp = await res.json();
      expect(resp.id).toBeDefined();
      expect(resp.joinUrl).toBeDefined();

      const mockRemoveParticipant = jest.spyOn(
        roomServiceClient,
        "removeParticipant"
      );
      res = await client.delete(`/room/${roomRes.id}/user/${resp.id}`);
      expect(res.status).toBe(204);
      expect(mockRemoveParticipant).toHaveBeenCalledTimes(1);
      expect(mockRemoveParticipant.mock.calls[0]).toEqual([
        roomRes.id,
        resp.id,
      ]);
    });

    it("should start and stop egress", async () => {
      let res = await client.post(`/room`);
      expect(res.status).toBe(201);
      const roomRes = await res.json();
      expect(roomRes.id).toBeDefined();

      let mockStartEgress = jest.spyOn(
        egressClient,
        "startRoomCompositeEgress"
      );
      mockStartEgress.mockReturnValueOnce(
        Promise.resolve({
          egressId: "egress-id",
        })
      );
      let mockStopEgress = jest.spyOn(egressClient, "stopEgress");
      mockStopEgress.mockReturnValueOnce(Promise.resolve(undefined));

      res = await client.delete(`/room/${roomRes.id}/egress`);
      expect(res.status).toBe(400);

      res = await client.post(`/stream`, {
        name: "stream",
      });
      expect(res.status).toBe(201);
      const streamResp = await res.json();

      res = await client.post(`/room/${roomRes.id}/egress`, {
        streamId: streamResp.id,
      });
      expect(res.status).toBe(204);

      // already started so should 400
      res = await client.post(`/room/${roomRes.id}/egress`, {
        streamId: streamResp.id,
      });
      expect(res.status).toBe(400);

      res = await client.delete(`/room/${roomRes.id}/egress`);
      expect(res.status).toBe(204);

      // already stopped so should 400
      res = await client.delete(`/room/${roomRes.id}/egress`);
      expect(res.status).toBe(400);

      expect(mockStartEgress).toHaveBeenCalledTimes(1);
      expect(mockStopEgress).toHaveBeenCalledTimes(1);
      expect(mockStopEgress.mock.calls[0][0]).toBe("egress-id");
    });
  });
});
