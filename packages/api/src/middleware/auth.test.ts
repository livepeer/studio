import bearerToken from "express-bearer-token";
import HttpHash from "http-hash";
import { authMiddleware } from ".";

import { ApiToken, User } from "../schema/types";
import { db } from "../store";
import {
  AuxTestServer,
  clearDatabase,
  setupUsers,
  startAuxTestServer,
  TestClient,
} from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";
import errorHandler from "./errorHandler";

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

let testServer: AuxTestServer;
let httpPrefix: string;

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

  const { app } = (testServer = await startAuxTestServer());
  app.use(bearerToken());
  app.use((req, res, next) => {
    req.config = { httpPrefix };
    next();
  });
  app.use(authMiddleware({}));
  app.all("/*", (_req, res) => res.status(204).end());
  app.use(errorHandler());
});

afterAll(() => testServer.close());

afterEach(async () => {
  await clearDatabase(server);
});

describe("auth middleware", () => {
  describe("api token access rules", () => {
    let adminUser: User;
    let adminApiKey: string;
    let nonAdminUser: User;
    let nonAdminApiKey: string;
    let client: TestClient;

    const setAccess = (token: string, rules?: ApiToken["access"]["rules"]) =>
      db.apiToken.update(nonAdminApiKey, {
        access: { rules },
      });

    beforeEach(async () => {
      ({
        adminUser,
        adminApiKey,
        nonAdminUser,
        nonAdminApiKey,
      } = await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));

      httpPrefix = "";
      client = new TestClient({ server: testServer });
    });

    it("should allow any route by default", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get("/whatever");
      expect(res.status).toBe(204);

      await setAccess(nonAdminApiKey, undefined);
      res = await client.get("/wherever");
      expect(res.status).toBe(204);
    });

    it("should disallow any route for no access rules", async () => {
      await setAccess(nonAdminApiKey, []);
      client.apiKey = nonAdminApiKey;
      const res = await client.get("/however");
      expect(res.status).toBe(403);
    });

    it("should route", async () => {
      const router = HttpHash();

      router.set("/gus/*", ["get", "post"]);
      router.set("/gus/fra", ["get", "post"]);
      // router.set("/gus/fra", ["put"]);
      router.set("/api/stream/hook/*", ["post"]);
      // router.set("/api/stream/hook/:ook", ["get"]);
      // router.set("/api/*/hook/:ook", ["post"]);

      const test = (route) => console.log(route, router.get(route));
      test("/gus/fra/bar");
      test("/gus");
      test("/gus/");
      test("/gu");
      test("/api/stream/hook");
      test("/api/stream/hook/detection");
    });
  });
});
