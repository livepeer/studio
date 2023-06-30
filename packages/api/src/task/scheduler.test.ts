import serverPromise, { TestServer } from "../test-server";
import { rabbitMgmt, setupUsers, TestClient } from "../test-helpers";
import { User } from "../schema/types";
import { db } from "../store";
import { TaskScheduler } from "./scheduler";
import { RabbitQueue } from "../store/queue";

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

jest.setTimeout(10000);

describe("scheduler handle tasks", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;
  let queue: RabbitQueue;
  let vhost: string;
  let taskScheduler: TaskScheduler;

  beforeEach(async () => {
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));
    client.jwtAuth = nonAdminToken;

    try {
      vhost = `test_${Date.now()}`;
      await rabbitMgmt.createVhost(vhost);
      queue = await RabbitQueue.connect(`amqp://localhost:5672/${vhost}`);
    } catch (e) {
      console.error(e);
      throw e;
    }

    taskScheduler = new TaskScheduler();
    taskScheduler.queue = queue;
    taskScheduler.config = {
      ipfsGatewayUrl: "",
      ingest: [{}],
    } as any;
  });

  afterEach(async () => {
    await queue.close();
    await rabbitMgmt.deleteVhost(vhost);
  });

  describe("processTaskResultPartial", () => {
    it("should update asset on a partial result", async () => {
      const spec = {
        name: "test",
        url: "https://example.com/test.mp4",
      };
      let res = await client.post(`/asset/upload/url`, spec);
      expect(res.status).toBe(201);
      const { asset, task } = await res.json();
      const files = [{ path: "/foo", type: "catalyst_hls_manifest" }];
      await taskScheduler.processTaskResultPartial({
        task: task,
        id: "",
        output: {
          upload: { assetSpec: { files: files } as any },
        },
        timestamp: 0,
        type: "task_result_partial",
      });

      const updated = await db.asset.get(asset.id);
      expect(updated.sourcePlaybackReady).toBe(true);
      expect(updated.files).toStrictEqual(files);

      const updatedTask = await db.task.get(task.id);
      expect(updatedTask.sourceReadyAt).toBeGreaterThan(0);
    });
  });
});
