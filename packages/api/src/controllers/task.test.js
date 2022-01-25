import serverPromise from "../test-server";
import { TestClient, clearDatabase } from "../test-helpers";

let server;
let mockAdminUser;
let mockNonAdminUser;
let mockTask;

beforeAll(async () => {
  server = await serverPromise;

  mockAdminUser = {
    email: "user_admin@gmail.com",
    password: "x".repeat(64),
  };

  mockNonAdminUser = {
    email: "user_non_admin@gmail.com",
    password: "y".repeat(64),
  };

  mockTask = {
    name: "My task",
    type: "Import",
  };
});

async function setupUsers(server) {
  const client = new TestClient({
    server,
  });
  // setting up admin user and token
  const userRes = await client.post(`/user/`, { ...mockAdminUser });
  let adminUser = await userRes.json();

  let tokenRes = await client.post(`/user/token`, { ...mockAdminUser });
  const adminToken = await tokenRes.json();
  client.jwtAuth = adminToken["token"];

  const user = await server.store.get(`user/${adminUser.id}`, false);
  adminUser = { ...user, admin: true, emailValid: true };
  await server.store.replace(adminUser);

  const resNonAdmin = await client.post(`/user/`, { ...mockNonAdminUser });
  let nonAdminUser = await resNonAdmin.json();

  tokenRes = await client.post(`/user/token`, { ...mockNonAdminUser });
  const nonAdminToken = await tokenRes.json();

  const nonAdminUserRes = await server.store.get(
    `user/${nonAdminUser.id}`,
    false
  );
  nonAdminUser = { ...nonAdminUserRes, emailValid: true };
  await server.store.replace(nonAdminUser);
  return { client, adminUser, adminToken, nonAdminUser, nonAdminToken };
}

describe("controllers/task", () => {
  describe("CRUD", () => {
    let client,
      adminUser,
      adminToken,
      nonAdminUser,
      nonAdminToken,
      generatedTask,
      generatedTaskIds;

    beforeAll(async () => {
      ({ client, adminUser, adminToken, nonAdminUser, nonAdminToken } =
        await setupUsers(server));
      generatedTaskIds = [];
    });

    afterAll(async () => {
      await clearDatabase(server);
    });

    it("create a task", async () => {
      let res = await client.post("/task", { ...mockTask });
      let resJson = await res.json();
      expect(res.status).toBe(201);
      generatedTask = resJson;
      generatedTaskIds.push(resJson.id);
      res = await client.post("/task", {
        ...mockTask,
        name: "task test 1",
      });
      resJson = await res.json();
      expect(res.status).toBe(201);
      expect(resJson.name).toBe("task test 1");
      generatedTaskIds.push(resJson.id);

      client.jwtAuth = nonAdminToken["token"];
      res = await client.post("/task", {
        ...mockTask,
        name: "task non admin 1",
      });
      resJson = await res.json();
      expect(res.status).toBe(201);
      expect(resJson.name).toBe("task non admin 1");
      generatedTaskIds.push(resJson.id);
      client.jwtAuth = adminToken["token"];
    });

    it("get task info", async () => {
      const res = await client.get(`/task/${generatedTask.id}`);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson.id).toEqual(generatedTask.id);
      expect(resJson.userId).toEqual(generatedTask.userId);
    });

    it("get task list", async () => {
      const res = await client.get(`/task?limit=1`);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(res.headers.get("link")).toEqual(
        expect.stringContaining("cursor=")
      );
      expect(resJson).toHaveLength(1);
      expect(resJson[0].userId).toEqual(generatedTask.userId);
      expect(generatedTaskIds).toContain(resJson[0].id);
    });

    it("get task list all", async () => {
      const res = await client.get(`/task?allUsers=1`);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson).toHaveLength(generatedTaskIds.length);
      expect(resJson.map((wh) => wh.name)).toContain("task non admin 1");
    });

    it("update a task", async () => {
      const { id } = generatedTask;
      let modifiedTask = { ...generatedTask, name: "modified task 1" };
      delete modifiedTask.createdAt;
      const res = await client.put(`/task/${id}`, modifiedTask);
      const resJson = await res.json();
      expect(res.status).toBe(200);
      expect(resJson.id).toEqual(id);

      const updated = await client.get(`/task/${id}`).then((r) => r.json());
      expect(updated.userId).toEqual(adminUser.id);
      expect(updated.name).toEqual("modified task 1");
    });

    it("delete a task", async () => {
      const res = await client.delete(`/task/${generatedTask.id}`);
      expect(res.status).toBe(204);

      client.jwtAuth = nonAdminToken.token;
      const res2 = await client.get(`/task/${generatedTask.id}`);
      const resJson2 = await res2.json();

      expect(res2.status).toBe(404);
    });
  });
});
