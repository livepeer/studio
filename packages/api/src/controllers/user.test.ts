import { v4 as uuid } from "uuid";

import { User } from "../schema/types";
import db from "../store/db";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";

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
      expect(res.status).toBe(403);

      res = await client.get(`/user`);
      expect(res.status).toBe(403);
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
      let res = await client.post("/user/", { ...mockUser });
      expect(res.status).toBe(201);
      const user = await res.json();
      expect(user.id).toBeDefined();
      expect(user.kind).toBe("user");
      expect(user.email).toBe(mockUser.email);

      const resUser = await db.user.get(user.id);
      expect(resUser.email).toEqual(user.email);

      // if same request is made, should return a 403
      res = await client.post("/user", {
        ...mockUser,
      });
      expect(res.status).toBe(400);
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
        `user does not have admin priviledges`
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
      const postMockUserNoPassword = JSON.parse(JSON.stringify(mockUser));
      postMockUserNoPassword.password = "";
      res = await client.post("/user/token", {
        ...postMockUserNoPassword,
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
      expect(req.status).toBe(201);
      let resToken = await req.json();
      expect(resToken.userId).toBe(userRes.id);
      expect(resToken.resetToken).toBeUndefined();

      const token = await db.passwordResetToken.get(resToken.id);
      expect(token).toMatchObject(resToken);
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
        `useremail ${nonAdminUser.email} has not been verified. Please check your inbox for verification email.`
      );

      client.apiKey = adminApiKey;
      res = await client.get("/user");
      resJson = await res.json();
      expect(res.status).toBe(403);
      expect(resJson.errors[0]).toBe(
        `useremail ${adminUser.email} has not been verified. Please check your inbox for verification email.`
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
