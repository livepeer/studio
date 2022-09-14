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
    let signingKey: WithID<SigningKey>;
    let samplePrivateKey: string;
    let otherSigningKey: WithID<SigningKey>;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
      let created: SigningKeyResponsePayload = await (
        await client.post("/signing-key")
      ).json();
      samplePrivateKey = created.privateKey;
      let res = await client.get(`/signing-key/${created.id}`);
      signingKey = await res.json();
      created = await (await client.post("/signing-key")).json();
      res = await client.get(`/signing-key/${created.id}`);
      otherSigningKey = await res.json();
    });

    it("should create a signing key and display the private key only on creation", async () => {
      const preCreationTime = Date.now();
      let res = await client.post("/signing-key");
      expect(res.status).toBe(201);
      const created = (await res.json()) as SigningKeyResponsePayload;
      expect(created.privateKey).toBeDefined();
      expect(created.publicKey).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeGreaterThanOrEqual(preCreationTime);
      res = await client.get(`/signing-key/${created.id}`);
      expect(res.status).toBe(200);
      const getResponse = await res.json();
      expect(getResponse.privateKey).toBeUndefined();
      expect(getResponse.publicKey).toEqual(created.publicKey);
      res = await client.delete(`/signing-key/${created.id}`);
      expect(res.status).toBe(204);
    });

    it("should create a JWT using the private key and verify it with the public key", async () => {
      const expiration = Math.floor(Date.now() / 1000) + 1000;
      const payload: JwtPayload = {
        sub: "4815162342",
        name: "Satoshi Nakamoto",
        admin: false,
        signature: "0x4815162342",
        exp: expiration,
      };
      const token = jwt.sign(payload, samplePrivateKey, { algorithm: "RS256" });
      const decoded = verifyJwt(token, signingKey.publicKey, {
        complete: true,
      });
      expect(decoded.payload["exp"]).toEqual(expiration);
      const failDecoded = verifyJwt(token, otherSigningKey.publicKey);
      expect(failDecoded).toBeInstanceOf(JsonWebTokenError);
      let res = await client.delete(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(204);
    });

    it("shoud delete the signing key", async () => {
      let res = await client.delete(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(204);
      res = await client.get(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(404);
    });
  });
});
