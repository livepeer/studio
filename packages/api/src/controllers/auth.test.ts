import { Response } from "node-fetch";

import { ApiToken, Asset, Stream, User } from "../schema/types";
import { db } from "../store";
import {
  AuxTestServer,
  clearDatabase,
  setupUsers,
  TestClient,
} from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";
import { pathJoin2 } from "./helpers";
import { v4 as uuid } from "uuid";

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

let testServer: AuxTestServer;

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

describe("controller/auth", () => {
  describe("api token access rules", () => {
    let adminUser: User;
    let adminApiKey: string;
    let nonAdminUser: User;
    let nonAdminApiKey: string;
    let client: TestClient;

    const setAccess = (token: string, rules?: ApiToken["access"]["rules"]) =>
      db.apiToken.update(token, { access: { rules } });

    const fetchAuth = async (method: string, path: string) => {
      const res = await client.fetch("/auth", {
        method,
        headers: {
          "x-original-uri": pathJoin2("https://livepeer.studio/", path),
        },
      });
      return res.status;
    };

    const expectStatus = (method: string, path: string) =>
      expect(fetchAuth(method, path)).resolves;

    beforeEach(async () => {
      ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminApiKey } =
        await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.apiKey = nonAdminApiKey;
    });

    it("should allow any route by default", async () => {
      await expectStatus("get", "/whatever").toBe(204);

      await setAccess(nonAdminApiKey, undefined);
      await expectStatus("get", "/wherever").toBe(204);
    });

    it("should disallow any route for empty access rules", async () => {
      await setAccess(nonAdminApiKey, []);
      await expectStatus("get", "/whichever").toBe(403);
      await expectStatus("get", "/bye").toBe(403);
    });

    describe("specific resource no methods", () => {
      beforeEach(() => setAccess(nonAdminApiKey, [{ resources: ["foo"] }]));

      it("should disallow other resources", async () => {
        await expectStatus("delete", "/bar").toBe(403);
        await expectStatus("get", "/zaz").toBe(403);
      });

      it("should allow any method", async () => {
        await expectStatus("get", "/foo").toBe(204);
        await expectStatus("post", "/foo").toBe(204);
        await expectStatus("delete", "/foo").toBe(204);
      });
    });

    describe("specific resources and methods", () => {
      beforeEach(() =>
        setAccess(nonAdminApiKey, [
          { resources: ["foo"], methods: ["options"] },
          { resources: ["foo/bar"], methods: ["get", "patch"] },
          { resources: ["foo/bar/zaz"], methods: ["head", "post"] },
        ])
      );

      it("should disallow other methods", async () => {
        await expectStatus("patch", "/foo").toBe(403);
        await expectStatus("post", "/foo").toBe(403);
        await expectStatus("get", "/foo").toBe(403);

        await expectStatus("delete", "/foo/bar").toBe(403);
        await expectStatus("post", "/foo/bar").toBe(403);
        await expectStatus("head", "/foo/bar").toBe(403);

        await expectStatus("put", "/foo/bar/zaz").toBe(403);
        await expectStatus("patch", "/foo/bar/zaz").toBe(403);
        await expectStatus("get", "/foo/bar/zaz").toBe(403);
      });

      it("should allow specified methods", async () => {
        await expectStatus("options", "/foo").toBe(204);
        await expectStatus("get", "/foo/bar").toBe(204);
        await expectStatus("patch", "/foo/bar").toBe(204);
        await expectStatus("head", "/foo/bar/zaz").toBe(204);
        await expectStatus("post", "/foo/bar/zaz").toBe(204);
      });
    });

    describe("path parameters", () => {
      beforeEach(() =>
        setAccess(nonAdminApiKey, [
          { resources: ["gus/:id"] },
          { resources: ["gus/fra/*"] },
        ])
      );

      it("should disallow other paths", async () => {
        await expectStatus("get", "/foo").toBe(403);
        await expectStatus("put", "/fra").toBe(403);
        await expectStatus("post", "/bar").toBe(403);
        await expectStatus("patch", "/gus").toBe(403);
        await expectStatus("patch", "/gus/bar/fra").toBe(403);
      });

      it("should allow matching paths", async () => {
        await expectStatus("get", "/gus/mad").toBe(204);
        await expectStatus("put", "/gus/tim").toBe(204);
        await expectStatus("head", "/gus/fra").toBe(204);
        await expectStatus("patch", "/gus/fra/bar").toBe(204);
        await expectStatus("options", "/gus/fra/bar/zaz").toBe(204);
        await expectStatus("post", "/gus/fra/bar/zaz").toBe(204);
      });
    });

    describe("alternative formats", () => {
      it("should allow leading slash", async () => {
        await setAccess(nonAdminApiKey, [{ resources: ["/gus/fra/bar"] }]);
        await expectStatus("get", "/gus").toBe(403);
        await expectStatus("put", "/fra").toBe(403);
        await expectStatus("post", "/bar").toBe(403);
        await expectStatus("patch", "/gus/fra/bar").toBe(204);
      });

      it("should allow explicit all methods and resources", async () => {
        await setAccess(nonAdminApiKey, [{ resources: ["*"], methods: ["*"] }]);
        await expectStatus("get", "/gus").toBe(204);
        await expectStatus("put", "/fra").toBe(204);
        await expectStatus("post", "/bar").toBe(204);
        await expectStatus("patch", "/gus/fra/bar").toBe(204);
      });
    });

    it("should block access on bad rules", async () => {
      await setAccess(nonAdminApiKey, [{ resources: ["far", "far"] }]);
      await expectStatus("post", "/far").toBe(403);

      await setAccess(nonAdminApiKey, [{ resources: ["zuz/*zaz"] }]);
      await expectStatus("get", "/zuz/123").toBe(403);

      await setAccess(nonAdminApiKey, [{ resources: ["zuz/*/bar"] }]);
      await expectStatus("put", "/zuz/123/s2e").toBe(403);

      await setAccess(nonAdminApiKey, [
        { resources: ["zzz/:param", "zzz/*confict"] },
      ]);
      await expectStatus("delete", "/zzz/abc").toBe(403);

      await setAccess(nonAdminApiKey, [{ resources: ["gfb?path=only"] }]);
      await expectStatus("get", "/gfb?path=only").toBe(403);
      await expectStatus("get", "/gfb").toBe(403);
    });

    it("should support nested routers", async () => {
      await setAccess(nonAdminApiKey, [
        { resources: ["router/nested/zaz", "router/foo", "bar"] },
      ]);
      await expectStatus("get", "/zaz").toBe(403);
      await expectStatus("get", "/router/bar").toBe(403);
      await expectStatus("get", "/router/nested/bar").toBe(403);
      await expectStatus("get", "/router/router/foo").toBe(403);
      await expectStatus("post", "/foo").toBe(403);

      await expectStatus("post", "/router/nested/zaz").toBe(204);
      await expectStatus("post", "/router/foo").toBe(204);
      await expectStatus("post", "/bar").toBe(204);
    });

    it("should handle query strings fine", async () => {
      await setAccess(nonAdminApiKey, [{ resources: ["foo"] }]);
      await expectStatus("post", "/foo?hello=query").toBe(204);
    });
  });

  describe("cors", () => {
    let adminUser: User;
    let adminApiKey: string;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminApiKey: string;
    let nonAdminToken: string;
    let client: TestClient;

    beforeEach(async () => {
      ({
        client,
        adminUser,
        adminApiKey,
        adminToken,
        nonAdminUser,
        nonAdminApiKey,
        nonAdminToken,
      } = await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    });

    const testMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

    const testOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://example.com",
      "http://test.com",
      "http://mydomain.io:420",
      "https://other.domain.net:8989",
      "https://staging.wetube.com",
      "http://blockflix.io:69",
    ];

    const allowedOrigins = [
      "http://localhost:3000",
      "https://staging.wetube.com",
      "http://blockflix.io:69",
    ];

    const fetchCors = async (method: string, path: string, origin: string) => {
      const res = await client.fetch("/auth", {
        method,
        headers: {
          "x-original-uri": pathJoin2("https://livepeer.studio/", path),
          origin,
        },
      });
      if (method === "OPTIONS") {
        expect(res.status).toEqual(204);
        expect(res.headers.get("access-control-allow-methods")).toEqual(
          "GET,HEAD,PUT,PATCH,POST,DELETE"
        );
      }
      expect(res.headers.get("access-control-allow-credentials")).toEqual(
        "true"
      );
      const corsAllowed =
        res.headers.get("access-control-allow-origin") === origin;
      return {
        corsAllowed,
        status: res.status,
        body: await res.json().catch((err) => null),
      };
    };

    const isAllowed = async (method: string, path: string, origin: string) => {
      const { corsAllowed, body } = await fetchCors(method, path, origin);
      return corsAllowed;
    };

    const expectAllowed = (method: string, path: string, origin: string) =>
      expect(isAllowed(method, path, origin)).resolves;

    it("should NOT allow requests from custom origins on regular paths", async () => {
      for (const method of testMethods) {
        for (const origin of testOrigins) {
          await expectAllowed(method, "/asset/upload", origin).toBe(false);
          await expectAllowed(method, "/asset/request-upload", origin).toBe(
            false
          );
          await expectAllowed(method, "/playback", origin).toBe(false);
          await expectAllowed(method, "/stream", origin).toBe(false);
          await expectAllowed(method, "/stream/abcd", origin).toBe(false);
          await expectAllowed(method, "/user", origin).toBe(false);
        }
      }
    });

    it("should allow CORS from frontend domain", async () => {
      client.jwtAuth = nonAdminToken;
      for (const method of testMethods) {
        await expectAllowed(method, "/stream", "https://livepeer.studio").toBe(
          true
        );
        await expectAllowed(method, "/asset", "https://livepeer.studio").toBe(
          true
        );
        await expectAllowed(
          method,
          "/api-token/1234",
          "https://livepeer.studio"
        ).toBe(true);
      }
    });

    const createApiToken = async (cors: ApiToken["access"]["cors"]) => {
      client.jwtAuth = nonAdminToken;
      let res = await client.post("/api-token", {
        name: "test",
        access: { cors },
      });
      client.jwtAuth = null;
      expect(res.status).toBe(201);
      const apiKeyObj = await res.json();
      expect(apiKeyObj).toMatchObject({
        id: expect.any(String),
        access: { cors },
      });
      return apiKeyObj.id;
    };

    it("should allow only the allowed origins", async () => {
      client.apiKey = await createApiToken({ allowedOrigins });
      for (const method of testMethods) {
        for (const origin of testOrigins) {
          const expected = allowedOrigins.includes(origin);

          await expectAllowed(method, "/asset/request-upload", origin).toBe(
            expected
          );
          await expectAllowed(method, "/asset", origin).toBe(expected);
          await expectAllowed(method, "/asset/abcd", origin).toBe(expected);
          await expectAllowed(method, "/stream", origin).toBe(expected);
          await expectAllowed(method, "/stream/1234", origin).toBe(expected);
          await expectAllowed(method, "/user", origin).toBe(expected);
          await expectAllowed(method, "/api-token", origin).toBe(expected);
        }
      }
    });

    const forbiddenApis = [
      ["GET", "/stream"],
      ["DELETE", "/stream/1234"],
      ["GET", "/user/1234"],
      ["POST", "/object-store"],
      ["GET", "/object-store/1234"],
    ];

    it("should allow only specific APIs to be called with CORS key", async () => {
      client.apiKey = await createApiToken({ allowedOrigins });
      // control case
      await expect(
        fetchCors("GET", "/stream/1234", allowedOrigins[0])
      ).resolves.toMatchObject({
        corsAllowed: true,
        status: 204,
      });
      await expect(
        fetchCors("GET", "/data/views/1234/total", allowedOrigins[0])
      ).resolves.toMatchObject({
        corsAllowed: true,
        status: 204,
      });

      for (const [method, path] of forbiddenApis) {
        await expect(
          fetchCors(method, path, allowedOrigins[0])
        ).resolves.toMatchObject({
          corsAllowed: true,
          status: 403,
          body: {
            errors: [
              "access forbidden for CORS-enabled API key with restricted access",
            ],
          },
        });
      }
    });

    it("should allow any API to be called by a full access key", async () => {
      client.apiKey = await createApiToken({
        allowedOrigins,
        fullAccess: true,
      });
      for (const [method, path] of forbiddenApis) {
        const { corsAllowed, status, body } = await fetchCors(
          method,
          path,
          allowedOrigins[0]
        );
        expect(corsAllowed).toBe(true);
        expect(status).toBe(204);
        if (status === 403) {
          expect(body).toMatchObject({
            errors: [
              "user can only request information on their own user object",
            ],
          });
        }
      }
    });

    it("should actually block requests from a disallowed origin (not only a soft CORS block)", async () => {
      client.apiKey = await createApiToken({ allowedOrigins });
      const apis = [
        ["POST", "/stream"],
        ["GET", "/stream/1234"],
        ["POST", "/asset/request-upload"],
      ];
      for (const [method, path] of apis) {
        await expect(
          fetchCors(method, path, "https://not.allowed.com")
        ).resolves.toMatchObject({
          corsAllowed: false,
          status: 403,
          body: {
            errors: [
              expect.stringMatching(
                /credential disallows CORS access from origin .+/
              ),
            ],
          },
        });
      }
    });
  });

  describe("user resources access", () => {
    let adminUser: User;
    let adminApiKey: string;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminApiKey: string;
    let nonAdminToken: string;
    let client: TestClient;

    let adminStream: Stream, adminAsset: Asset;
    let nonAdminStream: Stream, nonAdminAsset: Asset;

    beforeEach(async () => {
      ({
        client,
        adminUser,
        adminApiKey,
        adminToken,
        nonAdminUser,
        nonAdminApiKey,
        nonAdminToken,
      } = await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
      client.apiKey = nonAdminApiKey;

      nonAdminStream = await db.stream.create({
        id: uuid(),
        userId: nonAdminUser.id,
      } as any);
      nonAdminAsset = await db.asset.create({
        id: uuid(),
        userId: nonAdminUser.id,
      } as any);
      adminStream = await db.stream.create({
        id: uuid(),
        userId: adminUser.id,
      } as any);
      adminAsset = await db.asset.create({
        id: uuid(),
        userId: adminUser.id,
      } as any);
    });

    const fetchAuth = async (ids: { streamId?: string; assetId?: string }) => {
      const res = await client.fetch("/auth", {
        method: "GET",
        headers: {
          "x-original-uri": "https://livepeer.studio/api/data/views/1234/total",
          ...(ids.streamId ? { "x-livepeer-stream-id": ids.streamId } : null),
          ...(ids.assetId ? { "x-livepeer-asset-id": ids.assetId } : null),
        },
      });
      return res.status;
    };

    it("should disallow access to non-existent resources", async () => {
      await expect(fetchAuth({ streamId: "1234" })).resolves.toBe(404);
      await expect(fetchAuth({ assetId: "1234" })).resolves.toBe(404);
    });

    it("should disallow access to deleted resources", async () => {
      await db.stream.markDeleted(nonAdminStream.id);
      await db.asset.markDeleted(nonAdminAsset.id);
      await expect(fetchAuth({ streamId: nonAdminStream.id })).resolves.toBe(
        404
      );
      await expect(fetchAuth({ assetId: nonAdminAsset.id })).resolves.toBe(404);
    });

    it("should disallow access to other users resources", async () => {
      await expect(fetchAuth({ streamId: adminStream.id })).resolves.toBe(403);
      await expect(fetchAuth({ assetId: adminAsset.id })).resolves.toBe(403);
    });

    it("should allow access to own resources", async () => {
      await expect(fetchAuth({ streamId: nonAdminStream.id })).resolves.toBe(
        204
      );
      await expect(fetchAuth({ assetId: nonAdminAsset.id })).resolves.toBe(204);
    });

    it("should allow admins to access to other users resources", async () => {
      client.apiKey = adminApiKey;
      await expect(fetchAuth({ streamId: nonAdminStream.id })).resolves.toBe(
        204
      );
      await expect(fetchAuth({ assetId: nonAdminAsset.id })).resolves.toBe(204);
    });
  });
});
