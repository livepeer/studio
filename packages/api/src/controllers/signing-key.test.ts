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
    let otherUserToken: string;
    let signingKey: WithID<SigningKey>;
    let samplePrivateKey: string;
    let otherSigningKey: WithID<SigningKey>;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
      let created: SigningKeyResponsePayload = await client
        .post("/signing-key")
        .then((res) => res.json());
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
      expect(created).toMatchObject({
        id: expect.any(String),
        privateKey: expect.any(String),
        publicKey: expect.any(String),
        createdAt: expect.any(Number),
      });
      expect(created.createdAt).toBeGreaterThanOrEqual(preCreationTime);
      res = await client.get(`/signing-key/${created.id}`);
      expect(res.status).toBe(200);
      const getResponse = await res.json();
      const { privateKey, ...withoutPvtk } = created;
      expect(getResponse).toEqual(withoutPvtk);
    });

    it("should list all signing keys", async () => {
      const res = await client.get(`/signing-key`);
      expect(res.status).toBe(200);
    });

    it("should create a JWT using the private key and verify it with the public key", async () => {
      const expiration = Math.floor(Date.now() / 1000) + 1000;
      const payload: JwtPayload = {
        sub: "4815162342",
        name: "Satoshi Nakamoto",
        admin: false,
        signature: "0x4815162342",
        pub: signingKey.publicKey,
        exp: expiration,
      };
      const token = jwt.sign(payload, samplePrivateKey, { algorithm: "RS256" });
      const decoded = verifyJwt(token, signingKey.publicKey, {
        complete: true,
      });
      expect(decoded.payload["exp"]).toEqual(expiration);
      expect(() => jwt.verify(token, otherSigningKey.publicKey)).toThrow(
        JsonWebTokenError
      );
      let res = await client.delete(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(204);
    });

    it("should allow disable and enable the signing key & change the name", async () => {
      let res = await client.patch(`/signing-key/${signingKey.id}`, {
        disabled: true,
        name: "My test signing key 1",
      });
      expect(res.status).toBe(204);
      res = await client.get(`/signing-key/${signingKey.id}`);
      let updated = await res.json();
      expect(updated.disabled).toBe(true);
      expect(updated.name).toBe("My test signing key 1");
      res = await client.patch(`/signing-key/${signingKey.id}`, {
        disabled: false,
        name: "My test signing key 2",
      });
      expect(res.status).toBe(204);
      res = await client.get(`/signing-key/${signingKey.id}`);
      updated = await res.json();
      expect(updated.disabled).toBe(false);
      expect(updated.name).toBe("My test signing key 2");
    });

    it("should delete the signing key", async () => {
      let res = await client.delete(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(204);
      res = await client.get(`/signing-key/${signingKey.id}`);
      expect(res.status).toBe(404);
    });
  });
});
