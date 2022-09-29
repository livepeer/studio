import serverPromise, { TestServer } from "../test-server";
import {
  TestClient,
  clearDatabase,
  setupUsers,
  verifyJwt,
} from "../test-helpers";
import { SigningKey, SigningKeyResponsePayload, User } from "../schema/types";
import { WithID } from "../store/types";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { db } from "../store";

// includes auth file tests

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

describe("controllers/signing-key", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client: TestClient;
    let adminUser: User;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminToken: string;
    let otherUserToken: string;
    let signingKey: WithID<SigningKey>;
    let gatedPlaybackId: string;
    let publicPlaybackId: string;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
      let created: SigningKeyResponsePayload = await client
        .post("/access-control/signing-key")
        .then((res) => res.json());
      let res = await client.get(`/access-control/signing-key/${created.id}`);
      signingKey = await res.json();
      const res2 = await client.post("/stream", {
        name: "test",
        playbackPolicy: {
          type: "signed",
        },
      });
      const stream = await res2.json();
      gatedPlaybackId = stream.playbackId;
      const res3 = await client.post("/stream", {
        name: "test",
        playbackPolicy: {
          type: "public",
        },
      });
      const publicStream = await res3.json();
      publicPlaybackId = publicStream.playbackId;
    });

    it("should create a gate stream and allow playback with given public key", async () => {
      client.jwtAuth = adminToken;
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        pub: signingKey.publicKey,
        type: "jwt",
      });
      expect(res2.status).toBe(200);
    });

    it("should not allow playback on not existing streams or public keys", async () => {
      const res = await client.post("/access-control/gate", {
        stream: `video+0000000000`,
        pub: signingKey.publicKey,
        type: "jwt",
      });
      expect(res.status).toBe(403);
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        pub: "00000000000000",
        type: "jwt",
      });
      expect(res2.status).toBe(403);
    });

    it("should not allow playback if stream is gated an pub is missing", async () => {
      const res2 = await client.post("/access-control/gate", {
        stream: `video+${gatedPlaybackId}`,
        type: "jwt",
      });
      expect(res2.status).toBe(403);
    });

    it("should not allow playback if stream and public key does not share the same owner", async () => {
      const otherStream = await client.post("/stream", {
        name: "test",
        playbackPolicy: {
          type: "signed",
        },
      });
      const otherStreamPlaybackId = (await otherStream.json()).playbackId;
      const res = await client.post("/access-control/gate", {
        stream: `video+${otherStreamPlaybackId}`,
        pub: signingKey.publicKey,
        type: "jwt",
      });
      expect(res.status).toBe(403);
    });
  });
});
