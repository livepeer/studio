import HttpHash from "http-hash";

import { User } from "../schema/types";
import { clearDatabase, setupUsers, TestClient } from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";

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

describe("auth middleware", () => {
  describe("api token access rules", () => {
    let client: TestClient;
    let adminUser: User;
    let adminToken: string;
    let adminApiKey: string;
    let nonAdminUser: User;
    let nonAdminToken: string;
    let nonAdminApiKey: string;

    beforeEach(async () => {
      ({
        client,
        adminUser,
        adminToken,
        adminApiKey,
        nonAdminUser,
        nonAdminToken,
        nonAdminApiKey,
      } = await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.jwtAuth = nonAdminToken;
    });

    it("routing should work", () => {
      const router = HttpHash();

      router.set("/gus/*", ["get", "post"]);
      router.set("/gus/fra", ["get", "post"]);
      router.set("/gus/fra", ["put"]);
      router.set("/api/stream/hook/*", ["post"]);
      router.set("/api/stream/hook/:ook", ["get"]);
      router.set("/api/*/hook/:ook", ["post"]);

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
