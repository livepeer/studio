import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";

import { User } from "../schema/types";
import { db } from "../store";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";
import sql from "sql-template-strings";
import { NEVER_EXPIRING_JWT_CUTOFF_DATE } from "../middleware";
import {
  REFRESH_TOKEN_MIN_REUSE_DELAY_RATIO,
  REFRESH_TOKEN_REFRESH_THRESHOLD,
} from "./user";

let server: TestServer;
let mockUser: User;
let mockAdminUser: User;
let mockNonAdminUser: User;

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise;
  mockUser = {
    email: `mock_user@gmail.com`,
    password: "z".repeat(64),
  };

  mockAdminUser = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUser = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/user", () => {
  describe("basic CRUD with JWT authorization", () => {
    let client: TestClient;
    let adminUser: User;
    let adminToken: string;
    let nonAdminUser: User;
    let nonAdminToken: string;

    beforeEach(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server, mockAdminUser, mockNonAdminUser));
      client.jwtAuth = adminToken;
    });

    it("should not get all users without authorization", async () => {
      client.jwtAuth = "";
      let res = await client.get(`/user/${adminUser.id}`);
      expect(res.status).toBe(401);

      res = await client.get(`/user`);
      expect(res.status).toBe(401);
    });

    it("should get all users with admin authorization", async () => {
      for (let i = 0; i < 4; i += 1) {
        const u = await db.user.create({
          email: `user${i}@gmail.com`,
          password: "mypassword",
          id: uuid(),
          kind: "user",
        });
        const res = await client.get(`/user/${u.id}`);
        expect(res.status).toBe(200);
        const userRes = await res.json();
        expect(userRes.password).toBeUndefined();
        expect(userRes.salt).toBeUndefined();
        expect(userRes.id).toEqual(u.id);
      }

      const res = await client.get("/user");
      expect(res.status).toBe(200);
      const users = await res.json();
      expect(users.length).toEqual(6);
    });

    it("should update user with viewerLimit", async () => {
      const res = await client.patch(`/user/${nonAdminUser.id}`, {
        viewerLimit: 10,
      });
      expect(res.status).toBe(204);

      const updatedUser = await db.user.get(nonAdminUser.id);
      expect(updatedUser.id).toBe(nonAdminUser.id);
      expect(updatedUser.viewerLimit).toBe(10);
    });

    it("should get some of the users & get a working next Link", async () => {
      for (let i = 0; i < 13; i += 1) {
        const u = await db.user.create({
          email: `user${i}@gmail.com`,
          password: "mypassword",
          id: uuid(),
          kind: "user",
        });
        const res = await client.get(`/user/${u.id}`);
        expect(res.status).toBe(200);
        const user = await res.json();
        expect(user.id).toEqual(u.id);
      }
      const res = await client.get(`/user?limit=11`);
      const users = await res.json();
      expect(res.headers.raw().link).toBeDefined();
      expect(res.headers.raw().link.length).toBe(1);
      expect(users.length).toEqual(11);
    });

    it("should create a user without authorization and not allow repeat user creation", async () => {
      client.jwtAuth = "";
      const res = await client.post("/user/", { ...mockUser });
      expect(res.status).toBe(201);
      const user = await res.json();
      expect(user.id).toBeDefined();
      expect(user.kind).toBe("user");
      expect(user.email).toBe(mockUser.email);

      const resUser = await db.user.get(user.id);
      expect(resUser.email).toEqual(user.email);

      // Registering the same user again should fail
      const resTwo = await client.post("/user", { ...mockUser });
      let resTwoJson = await resTwo.json();
      expect(resTwo.status).toBe(409);
      expect(resTwoJson.errors[0]).toBe(
        "email already registered - please sign in instead or check your verification email",
      );

      // Registering a user with the same uppercased email should fail
      const resThree = await client.post("/user", {
        ...mockUser,
        email: mockUser.email.toUpperCase(),
      });
      let resThreeJson = await resThree.json();
      expect(resThree.status).toBe(409);
      expect(resThreeJson.errors[0]).toBe(
        "email already registered - please sign in instead or check your verification email",
      );
    });

    it("should make a user an admin with admin email", async () => {
      let res = await client.post("/user/", { ...mockUser });
      expect(res.status).toBe(201);
      const user = await res.json();
      expect(user.id).toBeDefined();

      let resAdminChange = await client.post(`/user/make-admin/`, {
        email: mockUser.email,
        admin: true,
      });
      expect(resAdminChange.status).toBe(200);
      let userAdmin = await resAdminChange.json();
      expect(userAdmin.email).toBe(mockUser.email);
      expect(userAdmin.admin).toBe(true);

      resAdminChange = await client.post(`/user/make-admin/`, {
        email: mockUser.email,
        admin: false,
      });
      expect(resAdminChange.status).toBe(200);
      userAdmin = await resAdminChange.json();
      expect(userAdmin.email).toBe(mockUser.email);
      expect(userAdmin.admin).toBe(false);
    });

    it("should not accept empty body for creating a user", async () => {
      const res = await client.post("/user");
      expect(res.status).toBe(422);
    });

    it("should not accept a non-valid email for creating a user", async () => {
      const postMockUser = JSON.parse(JSON.stringify(mockUser));
      postMockUser.email = "livepeer";
      const res = await client.post("/user", {
        ...postMockUser,
      });
      expect(res.status).toBe(422);
    });

    it("should not accept additional properties for creating a user", async () => {
      const postMockUser = JSON.parse(JSON.stringify(mockUser));
      postMockUser.name = "livepeer";
      const res = await client.post("/user", {
        ...postMockUser,
      });
      expect(res.status).toBe(422);
      const user = await res.json();
      expect(user.id).toBeUndefined();
    });

    it("should create a user, delete it, and error when attempting additional detele or replace", async () => {
      const res = await client.post("/user", {
        ...mockUser,
      });
      expect(res.status).toBe(201);
      const userRes = await res.json();
      expect(userRes.id).toBeDefined();

      const resGet = await db.user.get(userRes.id);
      expect(resGet.id).toEqual(userRes.id);

      // should delete user
      await db.user.delete(resGet.id);
      const deleted = await db.user.get(resGet.id);
      expect(deleted).toBe(null);

      // it should return a NotFound Error when trying to delete a record that doesn't exist
      let error;
      try {
        await db.user.delete(userRes.id);
      } catch (err) {
        error = err;
      }
      expect(error.status).toBe(404);

      // it should return a NotFound Error when trying to replace a record that doesn't exist
      let replaceError;
      try {
        await db.user.replace(userRes);
      } catch (err) {
        replaceError = err;
      }
      expect(replaceError.status).toBe(404);
    });

    it("should not get all users with non-admin user", async () => {
      client.jwtAuth = nonAdminToken;
      await db.user.update(nonAdminUser.id, {
        emailValid: true,
      });

      for (let i = 0; i < 3; i += 1) {
        const u = await db.user.create({
          email: `user${i}@gmail.com`,
          password: "mypassword",
          id: uuid(),
          kind: "user",
        });
        const res = await client.get(`/user/${u.id}`);
        expect(res.status).toBe(403);
      }

      let res = await client.get("/user");
      expect(res.status).toBe(403);

      // should not be able to make users admin with non-admin user
      const resAdminChange = await client.post(`/user/make-admin/`, {
        email: nonAdminUser.email,
      });
      console.log(`asdfsdf ${JSON.stringify(resAdminChange)}`);
      expect(resAdminChange.status).toBe(403);

      let adminChange = await resAdminChange.json();
      expect(adminChange.errors[0]).toBe(
        `user does not have admin priviledges`,
      );
    });

    it("should return a user token", async () => {
      client.jwtAuth = "";

      // response should contain error - no user previously created
      let res = await client.post("/user/token", {
        ...mockUser,
      });
      expect(res.status).toBe(404);
      let tokenRes = await res.json();
      expect(tokenRes.errors[0]).toBe(`user not found`);

      // create user
      res = await client.post("/user", {
        ...mockUser,
      });
      expect(res.status).toBe(201);

      // token request missing field, should return error
      res = await client.post("/user/token", {
        ...mockUser,
        password: undefined,
      });
      tokenRes = res.json();
      expect(res.status).toBe(422);

      // token request password less than required length of 64, should return error
      const postMockUserShortPassword = JSON.parse(JSON.stringify(mockUser));
      postMockUserShortPassword.password = "shortpassword";
      res = await client.post("/user/token", {
        ...postMockUserShortPassword,
      });
      tokenRes = res.json();
      expect(res.status).toBe(422);

      // token request wrong password, should return error
      const postMockUserWrongPassword = JSON.parse(JSON.stringify(mockUser));
      postMockUserWrongPassword.password = "w".repeat(64);
      res = await client.post("/user/token", {
        ...postMockUserWrongPassword,
      });
      tokenRes = res.json();
      expect(res.status).toBe(403);

      // token request additional properties, should return error
      const postMockUserAdditionalProp = JSON.parse(JSON.stringify(mockUser));
      postMockUserAdditionalProp.livepeer = "livepeer";
      res = await client.post("/user/token", {
        ...postMockUserAdditionalProp,
      });
      tokenRes = res.json();
      expect(res.status).toBe(422);

      // should not accept empty body for requesting a token
      res = await client.post("/user/token");
      tokenRes = res.json();
      expect(res.status).toBe(422);

      // token should be returned without error
      res = await client.post("/user/token", {
        ...mockUser,
      });
      expect(res.status).toBe(201);
      tokenRes = await res.json();
      expect(tokenRes.id).toBeDefined();
      expect(tokenRes.email).toBe(mockUser.email);
      expect(tokenRes.token).toBeDefined();
      expect(tokenRes.refreshToken).toBeDefined();

      // token should be returned without error with an uppercase email
      res = await client.post("/user/token", {
        ...mockUser,
        email: mockUser.email.toUpperCase(),
      });
      expect(res.status).toBe(201);
      tokenRes = await res.json();
      expect(tokenRes.id).toBeDefined();
      expect(tokenRes.email).toBe(mockUser.email);
      expect(tokenRes.token).toBeDefined();
      expect(tokenRes.refreshToken).toBeDefined();
    });

    it("should reset user password", async () => {
      const res = await client.post("/user", {
        ...mockUser,
      });
      expect(res.status).toBe(201);
      const userRes = await res.json();
      expect(userRes.id).toBeDefined();

      let user = await db.user.get(userRes.id);
      expect(user.id).toEqual(userRes.id);

      // should get password reset token
      let req = await client.post(`/user/password/reset-token`, {
        email: user.email,
      });

      // should return 201 when user email is valid
      if (user.emailValid) {
        expect(req.status).toBe(201);
        const tokens = await db.passwordResetToken.find([
          sql`password_reset_token.data->>'userId' = ${userRes.id}`,
        ]);
        const token = tokens[0][0];
        expect(token.resetToken).toBeDefined();

        // should return 404 when user email not found
        req = await client.post(`/user/password/reset-token`, {
          email: "noemail@gmail.com",
        });
        expect(req.status).toBe(404);
        let resp = await req.json();
        expect(resp.errors[0]).toBe("user not found");

        // should return 422 when extra property added to request
        req = await client.post(`/user/password/reset-token`, {
          email: "noemail@gmail.com",
          password: "a".repeat(64),
        });
        expect(req.status).toBe(422);

        // should reset user password
        req = await client.post(`/user/password/reset`, {
          email: user.email,
          password: "a".repeat(64),
          resetToken: token.resetToken,
        });

        expect(req.status).toBe(200);
        user = await db.user.get(userRes.id);
        expect(user.id).toEqual(userRes.id);
        expect(user.emailValid).toEqual(true);

        // should return 403 when password reset token not found
        req = await client.post(`/user/password/reset`, {
          email: user.email,
          password: "a".repeat(64),
          resetToken: uuid(),
        });
        expect(req.status).toBe(404);

        resp = await req.json();
        expect(resp.errors[0]).toBe("Password reset token not found");
      } else {
        // should return 403 when user email not verified
        expect(req.status).toBe(403);
      }
    });
  });

  describe("JWT token refresh", () => {
    let client: TestClient;
    let ACCESS_TOKEN_TTL: number;
    let REFRESH_TOKEN_TTL: number;

    let mockUserObj: User;

    beforeEach(async () => {
      client = new TestClient({ server });
      // JWT TTL args are in seconds but we use millis here, so multiply by 1000
      ACCESS_TOKEN_TTL = server.jwtAccessTokenTtl * 1000;
      REFRESH_TOKEN_TTL = server.jwtRefreshTokenTtl * 1000;

      const res = await client.post("/user/", mockUser);
      expect(res.status).toBe(201);
      mockUserObj = await res.json();
    });

    const expectValidAccessToken = async (token: string) => {
      const oldJwtAuth = client.jwtAuth;
      try {
        client.jwtAuth = token;
        const res = await client.get("/user/me");
        const user = await res.json();
        expect(user).toMatchObject({ id: mockUserObj.id });
        expect(res.status).toBe(200);
      } finally {
        client.jwtAuth = oldJwtAuth;
      }
    };

    const expectValidRefreshToken = async (refreshTokenId: string) => {
      const refreshToken = await db.jwtRefreshToken.get(refreshTokenId);
      expect(refreshToken).toMatchObject({
        id: refreshTokenId,
        userId: mockUserObj.id,
      });
      expect(refreshToken.lastSeen).toBeUndefined();
      expect(refreshToken.revoked).toBeFalsy();
      expect(refreshToken.createdAt).toBeLessThanOrEqual(Date.now());
      expect(refreshToken.expiresAt).toBeGreaterThan(
        Date.now() + REFRESH_TOKEN_TTL - 60000,
      );
    };

    it("should return access and refresh token", async () => {
      const res = await client.post("/user/token", mockUser);
      expect(res.status).toBe(201);
      const tokenRes = await res.json();
      expect(tokenRes.id).toBeDefined();
      expect(tokenRes.email).toBe(mockUser.email);
      expect(tokenRes.token).toBeDefined();
      expect(tokenRes.refreshToken).toBeDefined();

      await expectValidAccessToken(tokenRes.token);
      await expectValidRefreshToken(tokenRes.refreshToken);
    });

    describe("after login", () => {
      let token: string;
      let refreshToken: string;

      beforeEach(async () => {
        const res = await client.post("/user/token", mockUser);
        expect(res.status).toBe(201);
        ({ token, refreshToken } = await res.json());
      });

      const RealDate = Date.now;

      afterEach(() => {
        Date.now = RealDate;
      });

      const mockTimeDelay = (fakeDelay: number) => {
        const newDate = Date.now() + fakeDelay;
        Date.now = () => newDate;
      };

      it("should allow using refresh token to get another access token", async () => {
        const beforeRefresh = Date.now();

        const res = await client.post("/user/token/refresh", { refreshToken });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.token).toBeDefined();
        expect(body.token).not.toEqual(token);
        expect(body.refreshToken).toBeUndefined();

        await expectValidAccessToken(body.token);

        const refreshTokenObj = await db.jwtRefreshToken.get(refreshToken);
        expect(refreshTokenObj.lastSeen).toBeLessThanOrEqual(Date.now());
        expect(refreshTokenObj.lastSeen).toBeGreaterThanOrEqual(beforeRefresh);
        expect(refreshTokenObj.revoked).toBeFalsy();
      });

      it("should NOT allow using refresh token too often", async () => {
        let res = await client.post("/user/token/refresh", { refreshToken });
        expect(res.status).toBe(201);

        mockTimeDelay(
          ACCESS_TOKEN_TTL * REFRESH_TOKEN_MIN_REUSE_DELAY_RATIO - 60 * 1000,
        );

        res = await client.post("/user/token/refresh", { refreshToken });
        expect(res.status).toBe(401);
        const { errors } = await res.json();
        expect(errors[0]).toBe(
          "refresh token has already been used too recently",
        );

        const refreshTokenObj = await db.jwtRefreshToken.get(refreshToken);
        expect(refreshTokenObj.revoked).toBe(true);
      });

      it("should not accept access token after expiration", async () => {
        mockTimeDelay(ACCESS_TOKEN_TTL + 1000);

        client.jwtAuth = token;
        const res2 = await client.get("/user/me");
        expect(res2.status).toBe(401);
        const { errors } = await res2.json();
        expect(errors[0]).toBe("access token expired");
      });

      it("should allow refreshing token after access token expiration", async () => {
        mockTimeDelay(ACCESS_TOKEN_TTL + 1000);

        const res = await client.post("/user/token/refresh", {
          refreshToken,
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.refreshToken).toBeUndefined();

        await expectValidAccessToken(body.token);
      });

      it("should generate a new refresh token when close to expiration", async () => {
        mockTimeDelay(
          REFRESH_TOKEN_TTL * (1 - REFRESH_TOKEN_REFRESH_THRESHOLD) + 60 * 1000,
        );

        const res = await client.post("/user/token/refresh", {
          refreshToken,
        });
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.refreshToken).toBeDefined();

        await expectValidAccessToken(body.token);
        await expectValidRefreshToken(body.refreshToken);

        const oldRefreshTokenObj = await db.jwtRefreshToken.get(refreshToken);
        expect(oldRefreshTokenObj.revoked).toBe(true);
      });
    });

    describe("never-expiring JWTs migration", () => {
      let neverExpiringJwt: string;

      const RealDate = Date.now;

      afterEach(() => {
        Date.now = RealDate;
      });

      const mockTime = (newTime: number | string | Date) => {
        const newDate = new Date(newTime).getTime();
        Date.now = () => newDate;
      };

      beforeEach(async () => {
        // the migration API uses regular auth which requires email verification
        await db.user.update(mockUserObj.id, { emailValid: true });

        // same as user.ts signUserJwt but without expiresAt
        neverExpiringJwt = jwt.sign(
          { sub: mockUserObj.id, aud: server.jwtAudience },
          server.jwtSecret,
          {
            algorithm: "HS256",
            jwtid: uuid(),
          },
        );

        mockTime(NEVER_EXPIRING_JWT_CUTOFF_DATE - 24 * 60 * 60 * 1000);
      });

      it("should still allow accessing API", async () => {
        await expectValidAccessToken(neverExpiringJwt);
      });

      it("should NOT allow accessing API after cut-off date", async () => {
        mockTime(NEVER_EXPIRING_JWT_CUTOFF_DATE + 1);

        client.jwtAuth = neverExpiringJwt;
        const res = await client.get("/user/me");
        expect(res.status).toBe(401);
        const { errors } = await res.json();
        expect(errors[0]).toBe(
          "legacy access token detected. please log in again",
        );
      });

      it("should allow migrating to a refresh token", async () => {
        client.jwtAuth = neverExpiringJwt;
        const res = await client.post("/user/token/migrate");
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.token).not.toEqual(neverExpiringJwt);

        await expectValidAccessToken(body.token);
        await expectValidRefreshToken(body.refreshToken);
      });

      it("should NOT allow migrating using a new token (with expiration)", async () => {
        client.jwtAuth = neverExpiringJwt;
        const res = await client.post("/user/token/migrate");
        const { token: expiringToken } = await res.json();

        client.jwtAuth = expiringToken;
        const res2 = await client.post("/user/token/migrate");
        expect(res2.status).toBe(400);
        const { errors } = await res2.json();
        expect(errors[0]).toBe("can only migrate from never-expiring JWTs");
      });
    });
  });

  describe("user endpoint with api key", () => {
    let client: TestClient;
    let adminUser: User;
    let adminApiKey: string;
    let nonAdminUser: User;
    let nonAdminApiKey: string;

    beforeEach(async () => {
      ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminApiKey } =
        await setupUsers(server, mockAdminUser, mockNonAdminUser, false));
      client.apiKey = uuid();
    });

    it("should return personal user info", async () => {
      client.apiKey = nonAdminApiKey;
      let res = await client.get("/user/me");
      let resJson = await res.json();
      expect(resJson.email).toBe(nonAdminUser.email);
      expect(res.status).toBe(200);
    });

    it("should not get all users", async () => {
      // should return nonverified error
      client.apiKey = nonAdminApiKey;
      let res = await client.get("/user");
      let resJson = await res.json();
      expect(res.status).toBe(403);
      expect(resJson.errors[0]).toBe(
        `user ${nonAdminUser.email} has not been verified. please check your inbox for verification email.`,
      );

      client.apiKey = adminApiKey;
      res = await client.get("/user");
      resJson = await res.json();
      expect(res.status).toBe(403);
      expect(resJson.errors[0]).toBe(
        `user ${adminUser.email} has not been verified. please check your inbox for verification email.`,
      );

      // adding emailValid true to user
      await db.user.update(nonAdminUser.id, { emailValid: true });

      // should return admin priviledges error
      client.apiKey = nonAdminApiKey;
      res = await client.get("/user");
      resJson = await res.json();
      expect(res.status).toBe(403);
      expect(resJson.errors[0]).toBe("user does not have admin priviledges");

      // adding emailValid true to admin user
      await db.user.update(adminUser.id, { emailValid: true });

      // only jwt auth should be allowed access to this list API
      client.apiKey = adminApiKey;
      res = await client.get("/user");
      resJson = await res.json();
      expect(res.status).toBe(403);
      expect(resJson.errors[0]).toBe("user does not have admin priviledges");

      client.apiKey = undefined;
      client.basicAuth = `${adminUser.id}:${adminApiKey}`;
      res = await client.get("/user");
      resJson = await res.json();
      expect(res.status).toBe(403);
      expect(resJson.errors[0]).toBe("user does not have admin priviledges");
    });

    it("should return verified user", async () => {
      // set up admin user
      client.apiKey = adminApiKey;
      expect(adminUser.emailValid).toBe(false);

      // should return verified user
      let postData = {
        email: adminUser.email,
        emailValidToken: adminUser.emailValidToken,
      };

      let verifyRes = await client.post(`/user/verify`, { ...postData });
      expect(verifyRes.status).toBe(201);
      let verified = await verifyRes.json();
      expect(verified.email).toBe(adminUser.email);
      expect(verified.emailValid).toBe(true);

      // should return token validation error with missing emailValidToken field
      verifyRes = await client.post(`/user/verify`, { email: adminUser.email });
      expect(verifyRes.status).toBe(422);

      // should return token validation error with missing email field
      verifyRes = await client.post(`/user/verify`, {
        emailValidToken: adminUser.emailValidToken,
      });
      expect(verifyRes.status).toBe(422);

      // should return token validation error with incorrect token
      postData = {
        email: adminUser.email,
        emailValidToken: uuid(),
      };

      verifyRes = await client.post(`/user/verify`, { ...postData });
      expect(verifyRes.status).toBe(403);
      verified = await verifyRes.json();
      expect(verified.errors[0]).toBe("incorrect user validation token");

      // should return NotFound error with incorrect email
      postData = {
        email: "rando@livepeer.org",
        emailValidToken: adminUser.emailValidToken,
      };

      verifyRes = await client.post(`/user/verify`, { ...postData });
      expect(verifyRes.status).toBe(404);
    });
  });
});
