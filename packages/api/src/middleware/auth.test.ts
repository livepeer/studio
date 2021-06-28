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
  app.all("/admin/*", authMiddleware({ anyAdmin: true }), (_req, res) =>
    res.status(202).end()
  );
  app.all("/*", authMiddleware({}), (_req, res) => res.status(204).end());
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
      db.apiToken.update(token, { access: { rules } });

    const fetchStatus = async (method: string, path: string) => {
      const res = await client.fetch(path, { method });
      return res.status;
    };

    const expectStatus = (method: string, path: string) =>
      expect(fetchStatus(method, path)).resolves;

    beforeEach(async () => {
      ({
        adminUser,
        adminApiKey,
        nonAdminUser,
        nonAdminApiKey,
      } = await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));

      httpPrefix = "";
      client = new TestClient({ server: testServer });
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

        await expectStatus("options", "/foo/bar").toBe(403);
        await expectStatus("post", "/foo/bar").toBe(403);
        await expectStatus("head", "/foo/bar").toBe(403);

        await expectStatus("options", "/foo/bar/zaz").toBe(403);
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

    it("should trim http prefix when authorizing", async () => {
      httpPrefix = "/livepeer/api";
      await setAccess(nonAdminApiKey, [{ resources: ["goo"] }]);

      await expectStatus("head", "/zoo").toBe(403);
      await expectStatus("put", "/api/goo").toBe(403);
      await expectStatus("post", "/livepeer/api/goo/blah").toBe(403);

      await expectStatus("get", "/goo").toBe(204);
      await expectStatus("post", "/livepeer/api/goo").toBe(204);
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
    });

    it("should authorize admin independently", async () => {
      await setAccess(nonAdminApiKey, [{ resources: ["admin/bra"] }]);
      await expectStatus("post", "/admin/bra").toBe(403);

      client.apiKey = adminApiKey;
      await setAccess(adminApiKey, [{ resources: ["gus", "admin/foo"] }]);

      await expectStatus("post", "/fra").toBe(403);
      await expectStatus("put", "/admin/bar").toBe(403);

      await expectStatus("get", "/gus").toBe(204);
      await expectStatus("head", "/admin/foo").toBe(202);
    });
  });
});
