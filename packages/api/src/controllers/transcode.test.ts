import serverPromise, { TestServer } from "../test-server";
import { TestClient, clearDatabase, setupUsers } from "../test-helpers";
import { v4 as uuid } from "uuid";
import { User } from "../schema/types";
import { db } from "../store";

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

describe("controllers/transcode", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;

  beforeEach(async () => {
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;
  });

  describe("transcode video", () => {
    it("should transcode video from the public URL", async () => {
      let res = await client.post(`/transcode`, {
        input: {
          url: "https://directurl.com/video.mp4",
        },
        storage: {
          type: "s3",
          endpoint: "https://endpoint.com",
          credentials: {
            accessKeyId: "USERNAME",
            secretAccessKey: "PASSWORD",
          },
          bucket: "mybucket",
        },
        outputs: {
          hls: {
            path: "/output/hls",
          },
        },
      });
      expect(res.status).toBe(200);
      const task = await res.json();
      const taskId = task.id;

      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "transcode-file",
        params: {
          "transcode-file": {
            input: {
              url: "https://directurl.com/video.mp4",
            },
            storage: {
              url: "s3+https://***:***@endpoint.com/mybucket",
            },
            outputs: {
              hls: {
                path: "/output/hls",
              },
            },
          },
        },
        status: { phase: "waiting" },
      });

      await server.taskScheduler.processTaskEvent({
        id: uuid(),
        type: "task_result",
        timestamp: Date.now(),
        task: {
          id: taskId,
          type: "transcode-file",
          snapshot: await db.task.get(taskId),
        },
        error: null,
        output: null,
      });

      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "transcode-file",
        status: { phase: "completed" },
      });
    });

    it("should transcode video from private S3 bucket and remove credentials when task is completed", async () => {
      let res = await client.post(`/transcode`, {
        input: {
          type: "s3",
          endpoint: "https://inendpoint.com",
          credentials: {
            accessKeyId: "IN_USERNAME",
            secretAccessKey: "IN_PASSWORD",
          },
          bucket: "inbucket",
          path: "/input/video.mp4",
        },
        storage: {
          type: "s3",
          endpoint: "https://endpoint.com",
          credentials: {
            accessKeyId: "USERNAME",
            secretAccessKey: "PASSWORD",
          },
          bucket: "mybucket",
        },
        outputs: {
          hls: {
            path: "/output/hls",
          },
        },
      });
      expect(res.status).toBe(200);
      const task = await res.json();
      const taskId = task.id;

      client.apiKey = adminApiKey;
      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "transcode-file",
        params: {
          "transcode-file": {
            input: {
              url: "s3+https://IN_USERNAME:IN_PASSWORD@inendpoint.com/inbucket/input/video.mp4",
            },
            storage: {
              url: "s3+https://USERNAME:PASSWORD@endpoint.com/mybucket",
            },
            outputs: {
              hls: {
                path: "/output/hls",
              },
            },
          },
        },
        status: { phase: "waiting" },
      });

      await server.taskScheduler.processTaskEvent({
        id: uuid(),
        type: "task_result",
        timestamp: Date.now(),
        task: {
          id: taskId,
          type: "transcode-file",
          snapshot: await db.task.get(taskId),
        },
        error: null,
        output: null,
      });

      res = await client.get(`/task/${task.id}`);
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toMatchObject({
        id: taskId,
        type: "transcode-file",
        params: {
          "transcode-file": {
            input: {
              url: "s3+https://***:***@inendpoint.com/inbucket/input/video.mp4",
            },
            storage: {
              url: "s3+https://***:***@endpoint.com/mybucket",
            },
            outputs: {
              hls: {
                path: "/output/hls",
              },
            },
          },
        },
        status: { phase: "completed" },
      });
    });
  });
});
