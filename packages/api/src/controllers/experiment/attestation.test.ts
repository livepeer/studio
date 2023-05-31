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
    timestamp: 1685524255812,
  },
  signature:
    "0x8d5dc1ba0787fe1208d88cde8af00dfaded3979f6a03526579ffef2594dfb6f82ecc1120ceb55ab1500aae045e1bd6115995f9433c278dad6eabc094a31fcb051c",
};

let server: TestServer;
let id: string;

let dateNowSpy;

beforeAll(async () => {
  dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => 1685524255812);

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
      timestamp: 1685524255812,
    },
    signature:
      "0xdb7057384dde4a98ce7dd73b56e231a7d11dbad0bae41e6d4891c491527e3af32e2516fb50320b16f0074c4dfb94c2448243db2bec2a50e0aea42749aac648291b",
  });
  expect(res.status).toBe(201);
  jest.useRealTimers();
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
