import FormData from "form-data";
import { Headers, Response } from "node-fetch";
import { v4 as uuid } from "uuid";
import { AiGenerateLog, User } from "../schema/types";
import { db } from "../store";
import {
  AuxTestServer,
  TestClient,
  clearDatabase,
  createApiTokenInNewProject,
  createUser,
  setupUsers,
  startAuxTestServer,
} from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";
import { fetchWithTimeout, sleep } from "../util";

// we use the mock to simulate some error cases
jest.mock("../util", () => {
  const util = jest.requireActual("../util");
  return {
    ...util,
    fetchWithTimeout: jest.fn(util.fetchWithTimeout),
  };
});
const mockedFetchWithTimeout = fetchWithTimeout as jest.Mock;
const origFetchWithTimeout = mockedFetchWithTimeout.getMockImplementation(); // starts with original impl

const mockFetchHttpError = (
  status: number,
  contentType: string,
  body: string,
) => {
  mockedFetchWithTimeout.mockImplementation(async () => {
    // these are the only fields the API needs
    return {
      status,
      headers: new Headers({ "content-type": contentType }),
      buffer: async () => Buffer.from(body),
    } as Partial<Response>;
  });
};

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;
let mockOtherNonAdminUserInput: User;

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

  mockOtherNonAdminUserInput = {
    email: "other_user_non_admin@gmail.com",
    password: "z".repeat(64),
  };
});

afterEach(async () => {
  await clearDatabase(server);
});

const testBothRoutes = (testFn) => {
  describe("generate route", () => {
    testFn("/generate");
  });

  describe("beta generate route", () => {
    testFn("/beta/generate");
  });
};

describe("controllers/generate", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;
  let nonAdminApiKey: string;

  let aiGatewayServer: AuxTestServer;
  let aiGatewayCalls: Record<string, number>;

  beforeAll(async () => {
    aiGatewayServer = await startAuxTestServer(30303); // port configured in test-params.ts
    const apis = [
      "audio-to-text",
      "text-to-image",
      "image-to-image",
      "image-to-video",
      "upscale",
      "segment-anything-2",
      "llm",
    ];
    for (const api of apis) {
      aiGatewayServer.app.post(`/${api}`, async (req, res) => {
        aiGatewayCalls[api] = (aiGatewayCalls[api] || 0) + 1;

        await sleep(10);
        res.status(200).json({
          message: "success",
          reqContentType: req.headers["content-type"] ?? "unknown",
        });
      });
    }
  });

  afterAll(async () => {
    await aiGatewayServer.close();
  });

  beforeEach(async () => {
    mockedFetchWithTimeout.mockRestore();
    mockedFetchWithTimeout.mockImplementation(origFetchWithTimeout);

    ({
      client,
      adminUser,
      adminApiKey,
      nonAdminUser,
      nonAdminToken,
      nonAdminApiKey,
    } = await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));

    client.apiKey = adminApiKey;
    await client.post("/experiment", { name: "ai-generate" });
    await client.post("/experiment/ai-generate/audience", { allowAll: true });
    client.apiKey = null;
    client.jwtAuth = nonAdminToken;

    aiGatewayCalls = {};
  });

  const buildMultipartBody = (
    textFields: Record<string, any>,
    multipartField = { name: "image", contentType: "image/png" },
  ) => {
    const form = buildForm(textFields);
    form.append(multipartField.name, "dummy", {
      contentType: multipartField.contentType,
    });
    return form;
  };

  const buildForm = (textFields: Record<string, any>) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(textFields)) {
      form.append(k, v);
    }
    return form;
  };

  testBothRoutes((basePath) => {
    it(`should call the AI Gateway for ${basePath}/audio-to-text`, async () => {
      const res = await client.fetch(`${basePath}/audio-to-text`, {
        method: "POST",
        body: buildMultipartBody(
          {},
          { name: "audio", contentType: "audio/wav" },
        ),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: expect.stringMatching("^multipart/form-data"),
      });
      expect(aiGatewayCalls).toEqual({ "audio-to-text": 1 });
    });

    it(`should call the AI Gateway for ${basePath}/text-to-image`, async () => {
      const res = await client.post(`${basePath}/text-to-image`, {
        prompt: "a man in a suit and tie",
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: "application/json",
      });
      expect(aiGatewayCalls).toEqual({ "text-to-image": 1 });
    });

    it(`should call the AI Gateway for ${basePath}/image-to-image`, async () => {
      const res = await client.fetch(`${basePath}/image-to-image`, {
        method: "POST",
        body: buildMultipartBody({
          prompt: "replace the suit with a bathing suit",
        }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: expect.stringMatching("^multipart/form-data"),
      });
      expect(aiGatewayCalls).toEqual({ "image-to-image": 1 });
    });

    it(`should call the AI Gateway for ${basePath}/image-to-video`, async () => {
      const res = await client.fetch(`${basePath}/image-to-video`, {
        method: "POST",
        body: buildMultipartBody({}),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: expect.stringMatching("^multipart/form-data"),
      });
      expect(aiGatewayCalls).toEqual({ "image-to-video": 1 });
    });

    it(`should call the AI Gateway for ${basePath}/upscale`, async () => {
      const res = await client.fetch(`${basePath}/upscale`, {
        method: "POST",
        body: buildMultipartBody({ prompt: "enhance" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: expect.stringMatching("^multipart/form-data"),
      });
      expect(aiGatewayCalls).toEqual({ upscale: 1 });
    });

    it(`should call the AI Gateway for ${basePath}/segment-anything-2`, async () => {
      const res = await client.fetch(`${basePath}/segment-anything-2`, {
        method: "POST",
        body: buildMultipartBody({}),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: expect.stringMatching("^multipart/form-data"),
      });
      expect(aiGatewayCalls).toEqual({ "segment-anything-2": 1 });
    });

    it("should call the AI Gateway for generate API /llm", async () => {
      const res = await client.fetch("/beta/generate/llm", {
        method: "POST",
        body: buildForm({ prompt: "foo" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: expect.stringMatching("^multipart/form-data"),
      });
      expect(aiGatewayCalls).toEqual({ llm: 1 });
    });
  });

  describe("validates multipart schema", () => {
    const hugeForm = new FormData();
    const file11mb = "a".repeat(11 * 1024 * 1024);
    hugeForm.append("image", file11mb, {
      contentType: "image/png",
    });

    const testCases = [
      [
        "should fail with a missing required field",
        buildMultipartBody({}),
        "must have required property 'prompt'",
      ],
      [
        "should fail with bad type for a field",
        buildMultipartBody({ prompt: "impromptu", seed: "NaN" }),
        "must be integer",
      ],
      [
        "should fail with an unknown field",
        buildMultipartBody({
          prompt: "impromptu",
          extra_good_image: "yes pls",
        }),
        "must NOT have additional properties",
      ],
      ["should limit maximum payload size", hugeForm, "Field value too long"],
    ] as const;

    for (const [title, input, error] of testCases) {
      it(title, async () => {
        const res = await client.fetch("/generate/image-to-image", {
          method: "POST",
          body: input,
        });
        expect(res.status).toBe(422);
        expect(await res.json()).toEqual({
          errors: [expect.stringContaining(error)],
        });
        expect(aiGatewayCalls).toEqual({});
      });
    }
  });

  describe("request log", () => {
    async function getLastLog(userId: string) {
      const [logs] = await db.aiGenerateLog.find(
        { userId },
        {
          limit: 1,
          order: "coalesce((data->>'startedAt')::bigint, 0) desc",
        },
      );
      expect(logs).toHaveLength(1);
      return logs[0];
    }

    it("should log all requests to db", async () => {
      const res = await client.post("/generate/text-to-image", {
        prompt: "a man in a suit and tie",
      });
      expect(res.status).toBe(200);

      // wait for background operation to write log
      await sleep(100);

      const log = await getLastLog(nonAdminUser.id);
      expect(log).toEqual({
        id: expect.any(String),
        startedAt: expect.any(Number),
        durationMs: expect.any(Number),
        userId: nonAdminUser.id,
        projectId: nonAdminUser.defaultProjectId,
        type: "text-to-image",
        request: {
          model_id: "SG161222/RealVisXL_V4.0_Lightning", // default gets added
          prompt: "a man in a suit and tie",
        },
        statusCode: 200,
        response: {
          message: "success",
          reqContentType: "application/json",
        },
        success: true,
        error: undefined,
      } as Required<AiGenerateLog>);
      expect(log.durationMs).toBeGreaterThanOrEqual(10); // test gateway sleeps for 10ms
    });

    it("should log failed requests to db", async () => {
      mockFetchHttpError(
        500,
        "application/json",
        `{"details":{"msg":"sudden error"}}`,
      );

      const res = await client.post("/generate/text-to-image", {
        prompt: "a man in a suit and tie",
      });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        errors: ["Failed to generate text-to-image"], // 5xx errors get hidden from end users
      });

      await sleep(100);
      const log = await getLastLog(nonAdminUser.id);
      expect(log).toMatchObject({
        success: false,
        response: { details: { msg: "sudden error" } },
        error: "sudden error",
      } as Partial<AiGenerateLog>);
    });

    it("should log non JSON outputs as strings to db", async () => {
      mockFetchHttpError(418, "text/plain", `I'm not Jason`);

      const res = await client.post("/generate/text-to-image", {
        prompt: "a man in a suit and tie",
      });
      expect(res.status).toBe(418);
      expect(await res.text()).toEqual("I'm not Jason");

      await sleep(100);
      const log = await getLastLog(nonAdminUser.id);
      expect(log).toMatchObject({
        success: false,
        statusCode: 418,
        response: "I'm not Jason",
      } as Partial<AiGenerateLog>);
    });

    it("should log exceptions to db", async () => {
      mockedFetchWithTimeout.mockImplementation(() => {
        throw new Error("on your face");
      });
      const res = await client.post("/generate/text-to-image", {
        prompt: "a man in a suit and tie",
      });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        errors: ["Internal server error: Error"],
      });

      await sleep(100);
      const log = await getLastLog(nonAdminUser.id);
      expect(log).toMatchObject({
        success: false,
        error: "Error: on your face",
      } as Partial<AiGenerateLog>);
      expect(log.statusCode).toBeUndefined();
    });
  });

  describe("rate limiting", () => {
    // test params is configured with 5 reqs/min

    const pipelines = [
      "text-to-image",
      "image-to-image",
      "image-to-video",
      "upscale",
    ] as const;

    const makeAiGenReq = (pipeline: (typeof pipelines)[number]) =>
      pipeline === "text-to-image"
        ? client.post(`/generate/${pipeline}`, {
            prompt: "whatever you feel like",
          })
        : client.fetch(`/generate/${pipeline}`, {
            method: "POST",
            body: buildMultipartBody(
              pipeline === "image-to-video" ? {} : { prompt: "make magic" },
            ),
          });

    it("should rate limit requests", async () => {
      for (let i = 0; i < 5; i++) {
        const res = await makeAiGenReq("text-to-image");
        expect(res.status).toBe(200);
      }

      // sleep so the logs are written on db in background
      await sleep(100);
      const res = await makeAiGenReq("text-to-image");
      expect(res.status).toBe(429);
    });

    it("should rate limit reqeusts across different pipelines", async () => {
      for (let i = 0; i < 5; i++) {
        const res = await makeAiGenReq(pipelines[i % pipelines.length]);
        expect(res.status).toBe(200);
      }

      await sleep(100);
      for (const pip of pipelines) {
        const res = await makeAiGenReq(pip);
        expect(res.status).toBe(429);
      }
    });

    it("should not rate limit requests between different users", async () => {
      const otherUser = await createUser(
        server,
        client,
        mockOtherNonAdminUserInput,
        false,
        true,
      );

      // first user exhausts their reqs
      for (let i = 0; i < 5; i++) {
        const res = await makeAiGenReq("text-to-image");
        expect(res.status).toBe(200);
      }
      await sleep(100);

      // other user still has their quota to use
      client.jwtAuth = otherUser.token;
      for (let i = 0; i < 5; i++) {
        const res = await makeAiGenReq("text-to-image");
        expect(res.status).toBe(200);
      }
    });

    it("should have the same limit between projects", async () => {
      const { project, newApiKey } = await createApiTokenInNewProject(client);
      expect(newApiKey.projectId).toEqual(project.id);
      expect(newApiKey.projectId).not.toEqual(nonAdminUser.defaultProjectId);

      // exhaust requests across all projects
      client.jwtAuth = null;
      const projectTokens = [nonAdminApiKey, newApiKey.id];
      for (let i = 0; i < 5; i++) {
        client.apiKey = projectTokens[i % projectTokens.length];
        const res = await makeAiGenReq("text-to-image");
        expect(res.status).toBe(200);
      }
      await sleep(100);

      // 429 in all projects
      for (const token of projectTokens) {
        client.apiKey = token;
        const res = await makeAiGenReq("text-to-image");
        expect(res.status).toBe(429);
      }
    });

    it("should allow new requests after a minute", async () => {
      const firstReqStart = Date.now() - 58_000; // start 58s ago
      // create fake logs from previous requests
      for (let i = 0; i < 5; i++) {
        await db.aiGenerateLog.create({
          id: uuid(),
          startedAt: firstReqStart + 5000 * i, // space previous requests 5s apart
          userId: nonAdminUser.id,
          projectId: nonAdminUser.defaultProjectId,
        } as any); // we only need the above fields for rate-limiting
      }

      // doesn't allow a request immediately
      let res = await makeAiGenReq("text-to-image");
      expect(res.status).toBe(429);
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "0");
      expect(retryAfter).toBe(2); // in 2s the first req will be old enough

      // callers should wait for the retry-after period and try again
      await sleep(retryAfter * 1000);
      res = await makeAiGenReq("text-to-image");
      expect(res.status).toBe(200);
    });
  });
});
