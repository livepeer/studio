import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { SigningKey, SigningKeyResponsePayload, User } from "../schema/types";
import { db } from "../store";
import { WithID } from "../store/types";

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

describe("controllers/multistream-target", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client: TestClient;
    let adminUser: User;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminToken: string;
    let signingKey: WithID<SigningKey>;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
      let signingKey: WithID<SigningKey>;
      let created: SigningKeyResponsePayload = await (
        await client.post("/signing-key")
      ).json();
      let res = await client.get(`/signing-key/${created.publicKey.id}`);
      signingKey = await res.json();
    });

    it("should create a signing key and display the private key only on creation", async () => {
      const preCreationTime = Date.now();
      let res = await client.post("/signing-key");
      expect(res.status).toBe(201);
      const created = (await res.json()) as SigningKeyResponsePayload;
      expect(created.privateKey).toBeDefined();
      expect(created.publicKey).toBeDefined();
      expect(created.publicKey.id).toBeDefined();
      expect(created.publicKey.createdAt).toBeGreaterThanOrEqual(
        preCreationTime
      );
      res = await client.get(`/signing-key/${created.publicKey.id}`);
      expect(res.status).toBe(200);
      const getResponse = await res.json();
      expect(getResponse.privateKey).toBeUndefined();
      expect(getResponse.publicKey).toEqual(created.publicKey.publicKey);
    });

    /* it("shoud delete the signing key", async () => {
      let res = await client.delete(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(204);
      res = await client.get(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(404);
    });*/
  });
});
