import serverPromise, { TestServer } from "../../test-server";
import { TestClient, setupUsers } from "../../test-helpers";

const CREATOR_PUBLIC_KEY = "0xB7D5D7a6FcFE31611E4673AA3E61f21dC56723fC";
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
    timestamp: 1684241365,
  },
  signature:
    "0xb5e2ba76cae6b23ad6613753f701f9b8bb696d58cad9c7c11ca0fa10ad5a6b123fef9f6639e317f1d3f1a3131e50bfeb83dc02dd69a6b12cb7db665d19a9a49b1b",
};

let server: TestServer;
let id: string;

beforeAll(async () => {
  server = await serverPromise;
  let client: TestClient;
  let adminApiKey: string;
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
  res = await client.post("/experiment/-/attestation", REQUEST);
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
      timestamp: 1684241365,
    },
    signature:
      "0x1aeacd344dc66943a5261f5d0e488adb5a07b684acc91b445f24674c678ad35b681eefd10ac89a5350534632cba8052cb2d763ae7c3b65b3d80bbf298673de6a1c",
  });
  expect(res.status).toBe(201);
});

describe("Attestation API", () => {
  let client: TestClient;
  beforeEach(async () => {
    client = new TestClient({ server });
  });

  describe("POST /", () => {
    it("should return an error for invalid primaryType", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.primaryType = "InvalidType";
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(400);
    });

    it("should return an error for invalid domain", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.domain = {
        name: "Invalid Domain",
        version: "1",
      };
      const res = await client.post("/experiment/-/attestation", request);
      expect(res.status).toBe(400);
    });
    it("should return an error for invalid signature", async () => {
      let request = JSON.parse(JSON.stringify(REQUEST));
      request.signature =
        "0xb5e2ba76cae6b23ad6613753f701f9b8bb696d58cad9c7c11ca0fa10ad5a6b123fef9f6639e317f1d3f1a3131e50bfeb83dc02dd69a6b12cb7db665d19a9a49b1c";
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
