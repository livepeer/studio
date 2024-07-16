import serverPromise, { TestServer } from "../test-server";
import { clearDatabase, setupUsers, TestClient } from "../test-helpers";
import { User } from "../schema/types";
import {
  EgressClient,
  RoomServiceClient,
  WebhookReceiver,
} from "livekit-server-sdk";
import { db } from "../store";
import { EgressStatus } from "livekit-server-sdk/dist/proto/livekit_egress";

jest.mock("livekit-server-sdk");
const MockedRoomServiceClient =
  RoomServiceClient as jest.Mock<RoomServiceClient>;
const MockedEgressClient = EgressClient as jest.Mock<EgressClient>;
const MockedWebhookReceiver = WebhookReceiver as jest.Mock<WebhookReceiver>;

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
  let webhookReceiver;

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

    webhookReceiver = new WebhookReceiver("", "");
    MockedWebhookReceiver.mockReturnValue(webhookReceiver);
  });

  describe("room creation", () => {
    const createRoom = async () => {
      let res = await client.post(`/room`);
      expect(res.status).toBe(201);
      const roomRes = await res.json();
      expect(roomRes.id).toBeDefined();
      return roomRes.id;
    };

    it("should create and delete rooms", async () => {
      const roomId = await createRoom();

      expect(mockCreateRoom).toHaveBeenCalledTimes(1);
      const createOpts = mockCreateRoom.mock.calls[0][0];
      expect(roomId).toBe(createOpts.name);

      let res = await client.get(`/room/${roomId}`);
      expect(res.status).toBe(200);

      const getRoomRes = await res.json();
      expect(getRoomRes.id).toBe(roomId);
      expect(getRoomRes.userId).toBeUndefined();

      const mockDeleteRoom = jest.spyOn(roomServiceClient, "deleteRoom");
      res = await client.delete(`/room/${roomId}`);
      expect(res.status).toBe(204);
      expect(mockDeleteRoom).toHaveBeenCalledTimes(1);
      expect(mockDeleteRoom.mock.calls[0][0]).toBe(roomId);

      // should no longer exist
      res = await client.get(`/room/${roomId}`);
      expect(res.status).toBe(404);
    });

    it("should add and remove participants", async () => {
      const roomId = await createRoom();

      let res = await client.post(`/room/${roomId}/user`, {
        name: "display name",
      });
      expect(res.status).toBe(201);
      const resp = await res.json();
      expect(resp.id).toBeDefined();
      expect(resp.joinUrl).toBeDefined();

      const mockGetParticipant = jest.spyOn(
        roomServiceClient,
        "getParticipant",
      );
      mockGetParticipant.mockReturnValueOnce(
        Promise.resolve({
          identity: resp.id,
          name: "name",
          someOtherProp: "foo",
          permission: {},
          joinedAt: 1,
        }),
      );
      res = await client.get(`/room/${roomId}/user/${resp.id}`);
      expect(res.status).toBe(200);
      const participantResp = await res.json();
      expect(participantResp).toStrictEqual({
        id: resp.id,
        name: "name",
        permission: {},
        joinedAt: 1000,
      });

      res = await client.put(`/room/${roomId}/user/${resp.id}`, {
        canPublish: true,
      });
      expect(res.status).toBe(204);

      const mockRemoveParticipant = jest.spyOn(
        roomServiceClient,
        "removeParticipant",
      );
      res = await client.delete(`/room/${roomId}/user/${resp.id}`);
      expect(res.status).toBe(204);
      expect(mockRemoveParticipant).toHaveBeenCalledTimes(1);
      expect(mockRemoveParticipant.mock.calls[0]).toEqual([roomId, resp.id]);
    });

    it("should start and stop egress", async () => {
      const roomId = await createRoom();

      let mockStartEgress = jest.spyOn(
        egressClient,
        "startRoomCompositeEgress",
      );
      mockStartEgress.mockReturnValueOnce(
        Promise.resolve({
          egressId: "egress-id",
        }),
      );
      let mockStopEgress = jest.spyOn(egressClient, "stopEgress");
      mockStopEgress.mockReturnValueOnce(Promise.resolve(undefined));
      let mockListEgress = jest.spyOn(egressClient, "listEgress");
      mockListEgress.mockReturnValueOnce(Promise.resolve([]));
      const mockListRooms = jest.spyOn(roomServiceClient, "listRooms");
      mockListRooms.mockReturnValueOnce(Promise.resolve([{ name: "roomId" }]));

      let res = await client.delete(`/room/${roomId}/egress`);
      expect(res.status).toBe(400);

      res = await client.post(`/stream`, {
        name: "stream",
      });
      expect(res.status).toBe(201);
      const streamResp = await res.json();

      mockListEgress.mockReturnValueOnce(Promise.resolve([]));
      res = await client.post(`/room/${roomId}/egress`, {
        streamId: streamResp.id,
      });
      expect(res.status).toBe(204);

      mockListEgress.mockReturnValueOnce(
        Promise.resolve([
          { egressId: "egress-id", status: EgressStatus.EGRESS_ACTIVE },
        ]),
      );
      // already started so should 400
      res = await client.post(`/room/${roomId}/egress`, {
        streamId: streamResp.id,
      });
      expect(res.status).toBe(400);

      mockListEgress.mockReturnValueOnce(
        Promise.resolve([
          { egressId: "egress-id", status: EgressStatus.EGRESS_ACTIVE },
        ]),
      );
      res = await client.delete(`/room/${roomId}/egress`);
      expect(res.status).toBe(204);

      // already stopped so should 400
      mockListEgress.mockReturnValueOnce(Promise.resolve([]));
      res = await client.delete(`/room/${roomId}/egress`);
      expect(res.status).toBe(400);

      expect(mockStartEgress).toHaveBeenCalledTimes(1);
      expect(mockStopEgress).toHaveBeenCalledTimes(1);
      expect(mockStopEgress.mock.calls[0][0]).toBe("egress-id");
    });

    it("should handle room start webhooks", async () => {
      const roomId = await createRoom();

      let mockReceive = jest.spyOn(webhookReceiver, "receive");
      mockReceive.mockReturnValueOnce({
        event: "room_started",
        room: {
          sid: "RM_jwmTBxadhgF5",
          name: roomId,
          emptyTimeout: 900,
          maxParticipants: 10,
          creationTime: -62135596800,
          turnPassword: "xx",
          enabledCodecs: [
            { mime: "audio/opus", fmtpLine: "" },
            { mime: "audio/red", fmtpLine: "" },
            { mime: "video/VP8", fmtpLine: "" },
            { mime: "video/H264", fmtpLine: "" },
          ],
          metadata: '{"userId":"7bcfceda-acca-49ba-bcd3-712648a4fc65"}',
          numParticipants: 0,
          activeRecording: false,
        },
        id: "EV_gK4x7CTwp8CN",
        createdAt: 1683037589,
      });

      let res = await client.post(`/room/webhook`);
      expect(res.status).toBe(204);

      const room = await db.room.get(roomId);
      expect(room.events).toHaveLength(1);
      expect(room.events[0].eventName).toBe("room_started");
    });

    it("should handle egress start webhooks", async () => {
      const roomId = await createRoom();

      let mockReceive = jest.spyOn(webhookReceiver, "receive");
      mockReceive.mockReturnValueOnce({
        event: "egress_started",
        egressInfo: {
          egressId: "EG_jQFqQ72Mootx",
          roomId: "RM_jwmTBxadhgF5",
          roomName: roomId,
          status: 0,
          startedAt: 0,
          endedAt: 0,
          error: "",
          roomComposite: {
            roomName: roomId,
            layout: "speaker-dark",
            audioOnly: false,
            videoOnly: false,
            customBaseUrl: "",
            stream: {
              protocol: 1,
              urls: ["rtmp://localhost/live/*******************"],
            },
            advanced: {
              width: 0,
              height: 0,
              depth: 0,
              framerate: 0,
              audioCodec: 0,
              audioBitrate: 0,
              audioFrequency: 0,
              videoCodec: 0,
              videoBitrate: 0,
              keyFrameInterval: 2,
            },
            fileOutputs: [],
            streamOutputs: [
              {
                protocol: 1,
                urls: ["rtmp://localhost/live/07ca-xkrs-5cry-e65x"],
              },
            ],
            segmentOutputs: [],
          },
          stream: {
            info: [
              {
                url: "rtmp://localhost/live/*******************",
                startedAt: 0,
                endedAt: 0,
                duration: 0,
                status: 0,
                error: "",
              },
            ],
          },
          streamResults: [
            {
              url: "rtmp://localhost/live/*******************",
              startedAt: 0,
              endedAt: 0,
              duration: 0,
              status: 0,
              error: "",
            },
          ],
          fileResults: [],
          segmentResults: [],
        },
        id: "EV_2MZLJ3ypCUJn",
        createdAt: 1683037842,
      });

      let res = await client.post(`/room/webhook`);
      expect(res.status).toBe(204);

      const room = await db.room.get(roomId);
      expect(room.events).toHaveLength(1);
      expect(room.events[0].eventName).toBe("egress_started");
    });
  });
});
