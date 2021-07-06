import kubernetes from "./kubernetes";
import { Request, RequestHandler, Response } from "express";

/**
 * See also the mock implementation of @kubernetes/client-node in __mocks__
 */
// @ts-ignore
import { testOpts } from "@kubernetes/client-node";

describe("kubernetes middleware", () => {
  let middleware: RequestHandler;
  let req: Request;
  beforeEach(async () => {
    testOpts.fail = false;
  });

  describe("success cases", () => {
    beforeEach(async () => {
      req = {} as Request;
      middleware = kubernetes({
        kubeNamespace: "default",
        kubeBroadcasterService: "broadcaster",
        kubeBroadcasterTemplate: "https://{{nodeName}}.example.com",
        kubeOrchestratorService: "orchestrator",
        kubeOrchestratorTemplate: "https://{{ip}}:8935",
      });
      await new Promise((resolve) => {
        middleware(req, {} as Response, resolve);
      });
    });

    it("should return broadcasters from getBroadcasters()", async () => {
      const response = await req.getBroadcasters();
      expect(response).toEqual([
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
      ]);
    });

    it("should return orchestrators from getOrchestrators()", async () => {
      const response = await req.getOrchestrators();
      expect(response).toEqual([
        {
          address: "https://10.40.0.41:8935",
          cliAddress: "http://10.40.0.41:7935",
        },
        {
          address: "https://10.40.1.48:8935",
          cliAddress: "http://10.40.1.48:7935",
        },
        {
          address: "https://10.40.2.59:8935",
          cliAddress: "http://10.40.2.59:7935",
        },
      ]);
    });

    it("should survive failure of the control pane", async () => {
      testOpts.fail = true;
      let error;
      try {
        await req.getBroadcasters();
      } catch (e) {
        error = e;
      }
      expect(error).toEqual(new Error("intentional test failure"));
      testOpts.fail = false;
      const firstResponse = await req.getBroadcasters();
      testOpts.fail = true;
      const secondResponse = await req.getBroadcasters();
      expect(firstResponse).toEqual(secondResponse);
    });
  });

  describe("success cases", () => {
    beforeEach(async () => {
      req = {} as Request;
      middleware = kubernetes({
        kubeNamespace: "default",
        kubeBroadcasterService: "broadcaster-noaddress",
        kubeBroadcasterTemplate: "https://{{nodeName}}.example.com",
        kubeOrchestratorService: "orchestrator-noaddress",
        kubeOrchestratorTemplate: "https://{{ip}}:8935",
      });
      await new Promise((resolve) => {
        middleware(req, {} as Response, resolve);
      });
    });

    it("should return nothing if no addresses are provided", async () => {
      const broadcasters = await req.getBroadcasters();
      expect(broadcasters).toEqual([]);
      const orchestrators = await req.getOrchestrators();
      expect(orchestrators).toEqual([]);
    });
  });
});
