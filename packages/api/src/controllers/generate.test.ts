import FormData from "form-data";
import { User } from "../schema/types";
import {
  AuxTestServer,
  TestClient,
  clearDatabase,
  setupUsers,
  startAuxTestServer,
} from "../test-helpers";
import serverPromise, { TestServer } from "../test-server";

let server: TestServer;
let mockAdminUserInput: User;
let mockNonAdminUserInput: User;

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
});

afterEach(async () => {
  await clearDatabase(server);
});

describe("controllers/generate", () => {
  let client: TestClient;
  let adminUser: User;
  let adminApiKey: string;
  let nonAdminUser: User;
  let nonAdminToken: string;

  let aiGatewayServer: AuxTestServer;
  let aiGatewayCalls: Record<string, number>;

  beforeAll(async () => {
    aiGatewayServer = await startAuxTestServer(30303); // port configured in test-params.ts
    const apis = [
      "text-to-image",
      "image-to-image",
      "image-to-video",
      "upscale",
    ];
    for (const api of apis) {
      aiGatewayServer.app.post(`/${api}`, (req, res) => {
        aiGatewayCalls[api] = (aiGatewayCalls[api] || 0) + 1;
        return res.status(200).json({
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
    ({ client, adminUser, adminApiKey, nonAdminUser, nonAdminToken } =
      await setupUsers(server, mockAdminUserInput, mockNonAdminUserInput));

    client.apiKey = adminApiKey;
    await client.post("/experiment", {
      name: "ai-generate",
      audienceUserIds: [adminUser.id, nonAdminUser.id],
    });
    client.apiKey = null;
    client.jwtAuth = nonAdminToken;

    aiGatewayCalls = {};
  });

  const buildMultipartBody = (textFields: Record<string, any>) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(textFields)) {
      form.append(k, v);
    }
    form.append("image", "dummy", {
      contentType: "image/png",
    });
    return form;
  };

  describe("API proxies", () => {
    it("should call the AI Gateway for generate API /text-to-image", async () => {
      const res = await client.post("/beta/generate/text-to-image", {
        prompt: "a man in a suit and tie",
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        message: "success",
        reqContentType: "application/json",
      });
      expect(aiGatewayCalls).toEqual({ "text-to-image": 1 });
    });

    it("should call the AI Gateway for generate API /image-to-image", async () => {
      const res = await client.fetch("/beta/generate/image-to-image", {
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

    it("should call the AI Gateway for generate API /image-to-video", async () => {
      const res = await client.fetch("/beta/generate/image-to-video", {
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

    it("should call the AI Gateway for generate API /upscale", async () => {
      const res = await client.fetch("/beta/generate/upscale", {
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
        const res = await client.fetch("/beta/generate/image-to-image", {
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
});
