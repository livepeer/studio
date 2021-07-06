import { Request, RequestHandler, Response } from "express";

import hardcodedNodes, { Ingest, Price } from "./hardcoded-nodes";

/**
 * See also the mock implementation of @kubernetes/client-node in __mocks__
 */

describe("kubernetes middleware", () => {
  let middleware: RequestHandler;
  let req: Request;

  const broadcasters = [
    {
      address: "https://gke-ams-prod-cpu-efde94aa-2k9f.example.com",
      cliAddress: "http://10.40.0.46:7935",
    },
    {
      address: "https://gke-ams-prod-cpu-efde94aa-k8lz.example.com",
      cliAddress: "http://10.40.1.52:7935",
    },
    {
      address: "https://gke-ams-prod-cpu-efde94aa-5sr7.example.com",
      cliAddress: "http://10.40.2.67:7935",
    },
  ];

  const orchestrators = [
    {
      address: "https://gke-ams-prod-cpu-efde94aa-2k9f.example.com",
      cliAddress: "http://10.40.0.46:7935",
    },
    {
      address: "https://gke-ams-prod-cpu-efde94aa-k8lz.example.com",
      cliAddress: "http://10.40.1.52:7935",
    },
    {
      address: "https://gke-ams-prod-cpu-efde94aa-5sr7.example.com",
      cliAddress: "http://10.40.2.67:7935",
    },
  ];

  const ingest: Ingest[] = [
    {
      ingest: "https://gke-ams-prod-cpu-efde94aa-2k9f.example.com",
      playback: "http://10.40.0.46:7935",
    },
  ];

  const prices: Price[] = [
    {
      address: "0xfoo",
      priceInfo: {
        pricePerUnit: "100",
        pixelsPerUnit: "20",
      },
    },
  ];

  beforeEach(async () => {
    req = {} as Request;
    middleware = hardcodedNodes({
      broadcasters: JSON.stringify(broadcasters),
      orchestrators: JSON.stringify(orchestrators),
      ingest: JSON.stringify(ingest),
      prices: JSON.stringify(prices),
    });
    await new Promise((resolve) => {
      middleware(req, {} as Response, resolve);
    });
  });

  it("should return broadcasters from getBroadcasters()", async () => {
    const response = await req.getBroadcasters();
    expect(response).toEqual(broadcasters);
  });

  it("should return orchestrators from getOrchestrators()", async () => {
    const response = await req.getOrchestrators();
    expect(response).toEqual(orchestrators);
  });

  it("should return ingest from getIngest()", async () => {
    expect(await req.getIngest()).toEqual(ingest);
  });

  it("should return prices from getPrices()", async () => {
    expect(await req.getPrices()).toEqual(prices);
  });

  it("should throw an error with bad JSON", async () => {
    expect(() => {
      hardcodedNodes({
        broadcasters: "this is not json",
        orchestrators: "neither is this",
        ingest: "definitely not this",
        prices: "nor this",
      });
    }).toThrow();
  });
});
