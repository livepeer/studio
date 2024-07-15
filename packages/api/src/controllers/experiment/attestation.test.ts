import serverPromise, { TestServer } from "../../test-server";
import { TestClient, clearDatabase, setupUsers } from "../../test-helpers";
import { v4 as uuid } from "uuid";

const CREATOR_PUBLIC_KEY = "0xB7D5D7a6FcFE31611E4673AA3E61f21dC56723fC";
const NOW = 1685527855812;
const HOUR = 3600000;
const REQUEST = {
  primaryType: "VideoAttestation",
  domain: {
    name: "Verifiable Video",
    version: "1",
  },
  message: {
    video: "ipfs://bafybeihhhndfxtursaadlvhuptet6zqni4uhg7ornjtlp5qwngv33ipv6m",
    attestations: [
      {
        role: "creator",
        address: CREATOR_PUBLIC_KEY,
      },
    ],
    signer: CREATOR_PUBLIC_KEY,
    timestamp: NOW - HOUR,
  },
  signature:
    "0x8d5dc1ba0787fe1208d88cde8af00dfaded3979f6a03526579ffef2594dfb6f82ecc1120ceb55ab1500aae045e1bd6115995f9433c278dad6eabc094a31fcb051c",
};

const FLOW_REQUEST = {
  primaryType: "VideoAttestation",
  domain: {
    name: "Verifiable Video",
    version: "1",
  },
  message: {
    video: "ipfs://bafybeihhhndfxtursaadlvhuptet6zqni4uhg7ornjtlp5qwngv33ipv6m",
    attestations: [
      {
        role: "creator",
        address: "0xd10f88cea4ef9a06",
      },
    ],
    signer: "0xd10f88cea4ef9a06",
    timestamp: NOW - HOUR,
  },
  signature:
    "5a8a93d3c0abbfc93ab111c67dcd41f521e826c9cc67fa0cbe5870428aec819463be0064e52d31c2041b6ea21bef0f5305d077583f8cc5d401d12ffd8b84d67c",
};

let server: TestServer;
let id: string;
let adminApiKey: string;

let dateNowSpy;

beforeAll(async () => {
  dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => NOW);

  server = await serverPromise;
});

beforeEach(async () => {
  let client: TestClient;
  ({ client, adminApiKey } = await setupUsers(
    server,
    {
      email: "user_admin@gmail.com",
      password: "x".repeat(64),
    },
    {
      email: "user_non_admin@gmail.com",
      password: "y".repeat(64),
    }
  ));
  client.apiKey = adminApiKey;

  let res = await client.post(`/experiment`, {
    name: "attestation",
    audienceAllowAll: true,
  });
  expect(res.status).toBe(201);
  res = await client.post(`/experiment/attestation/audience`, {
    allowAll: true,
  });
  expect(res.status).toBe(204);

  client = new TestClient({ server });
  res = await client.post("/experiment/-/attestation", {
    primaryType: "VideoAttestation",
    domain: {
      name: "Verifiable Video",
      version: "1",
    },
    message: {
      video:
        "ipfs://bafybeihhhndfxtursaadlvhuptet6zqni4uhg7ornjtlp5qwngv33ipv6m",
      attestations: [
        {
          role: "creator",
          address: "0xB7D5D7a6FcFE31611E4673AA3E61f21dC56723fC",
        },
      ],
      signer: "0xB7D5D7a6FcFE31611E4673AA3E61f21dC56723fC",
      timestamp: NOW,
    },
    signature:
      "0xa76d8f101cb89e5f5e32550308a263f9c6bfef2a01eb7e74a46e6eb5bc1c696c0a7378ed79db55e556fc8e9a18dd1417d4c82eafa133515b3f0358a7baa337971c",
  });
  expect(res.status).toBe(201);
  id = (await res.json()).id;

  res = await client.post("/experiment/-/attestation", {
    primaryType: "VideoAttestation",
    domain: {
      name: "Verifiable Video",
      version: "1",
    },
    message: {
      video:
        "ipfs://bafybeihhhndfxtursaadlvhuptet6zqni4uhg7ornjtlp5qwngv33ipv6m",
      attestations: [
        {
          role: "creator",
          address: "0xED0B4b69e7199C18A9674e8678B708Cd371a638A",
        },
      ],
      signer: "0xED0B4b69e7199C18A9674e8678B708Cd371a638A",
      timestamp: NOW - HOUR,
    },
    signature:
      "0xdb7057384dde4a98ce7dd73b56e231a7d11dbad0bae41e6d4891c491527e3af32e2516fb50320b16f0074c4dfb94c2448243db2bec2a50e0aea42749aac648291b",
  });
  expect(res.status).toBe(201);
});

afterEach(async () => {
  await clearDatabase(server);
});

afterAll(() => {
  dateNowSpy.mockRestore();
});

describe("Attestation API", () => {
  let client: TestClient;
  beforeEach(async () => {
    client = new TestClient({ server });
  });

  describe("POST /", () => {
    it("should support Flow Wallet signatures", async () => {
      const res = await client.post("/experiment/-/attestation", FLOW_REQUEST);
      expect(res.status).toBe(201);
    });

    it("should return an error for invalid primaryType", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.primaryType = "InvalidType";
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(422);
    });

    it("should return an error for invalid domain", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.domain = {
        name: "Invalid Domain",
        version: "1",
      };
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(422);
    });
    it("should return an error for invalid signature", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.signature =
        "0xb5e2ba76cae6b23ad6613753f701f9b8bb696d58cad9c7c11ca0fa10ad5a6b123fef9f6639e317f1d3f1a3131e50bfeb83dc02dd69a6b12cb7db665d19a9a49b1c";
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(400);
    });

    it("should return an error for invalid Flow Wallet signature", async () => {
      let request = JSON.parse(JSON.stringify(FLOW_REQUEST));
      request.message.signer = "0xd10f88cea4ef9a05";
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(400);
    });

    it("should return an error for the future timestamp", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.message.timestamp = NOW + HOUR;
      request.signature =
        "0x38661a5558c638c4f11b2f8272f83a712dcc352032e9cf15a5c64afbb046ea70474fc766167dff99c7408be41cad8102aa3b4081a72c776fcf9d8966548f9a431b";
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /:id", () => {
    it("should return the attestation metadata with the given id", async () => {
      const res = await client.get(`/experiment/-/attestation/${id}`);
      expect(res.status).toEqual(200);
    });

    it("should return error for non-existing attestation metadata", async () => {
      const res = await client.get(`/experiment/-/attestation/12345`);
      expect(res.status).toEqual(404);
    });

    it("should export attestation into IPFS and get task by its CID", async () => {
      let res = await client.get(`/experiment/-/attestation/${id}`);
      expect(res.status).toEqual(200);
      let attestation = await res.json();
      expect(attestation.storage.ipfs).not.toBeNull();

      const taskId = attestation.storage.status.tasks.pending;
      expect(taskId).not.toBeNull();
      client.apiKey = adminApiKey;
      res = await client.get(`/task/${taskId}`);
      expect(res.status).toBe(200);
      const task = await res.json();
      expect(task.type).toEqual("export-data");

      await server.taskScheduler.processTaskEvent({
        id: uuid(),
        type: "task_result",
        timestamp: Date.now(),
        task: {
          id: taskId,
          type: "export-data",
          snapshot: task,
        },
        error: null,
        output: {
          exportData: {
            ipfs: {
              cid: "QmX",
            },
          },
        },
      });
      res = await client.get(`/experiment/-/attestation/QmX`);
      expect(res.status).toEqual(200);
      attestation = await res.json();
      expect(attestation.storage.ipfs.cid).toEqual("QmX");
      expect(attestation.storage.status.phase).toEqual("ready");
    });
  });

  it("should fail export attestation into IPFS", async () => {
    let res = await client.get(`/experiment/-/attestation/${id}`);
    expect(res.status).toEqual(200);
    let attestation = await res.json();
    const taskId = attestation.storage.status.tasks.pending;

    expect(taskId).not.toBeNull();
    client.apiKey = adminApiKey;
    res = await client.get(`/task/${taskId}`);
    expect(res.status).toBe(200);
    const task = await res.json();
    expect(task.type).toEqual("export-data");

    await server.taskScheduler.processTaskEvent({
      id: uuid(),
      type: "task_result",
      timestamp: Date.now(),
      task: {
        id: taskId,
        type: "export-data",
        snapshot: task,
      },
      error: {
        message: "oh no it failed!",
        unretriable: true,
      },
      output: null,
    });

    res = await client.get(`/experiment/-/attestation/${id}`);
    expect(res.status).toEqual(200);
    attestation = await res.json();
    expect(attestation.storage.status.phase).toEqual("failed");
    expect(attestation.storage.status.tasks.failed).toEqual(taskId);
  });

  describe("GET /", () => {
    it("should return a list of attestation metadata entries", async () => {
      const res = await client.get(`/experiment/-/attestation`);

      expect(res.status).toEqual(200);
      const entries = await res.json();
      expect(entries.length).toEqual(2);
    });

    it("should return a list of attestation metadata entries from the given creator", async () => {
      const res = await client.get(
        `/experiment/-/attestation?creator=${CREATOR_PUBLIC_KEY}`
      );

      expect(res.status).toEqual(200);
      const entries = await res.json();
      expect(entries.length).toEqual(1);
    });
  });
});
