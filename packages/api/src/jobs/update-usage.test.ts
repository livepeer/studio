import * as appRouter from "../app-router";
import * as stripeController from "../controllers/stripe";
import { cache } from "../store/cache";
import Queue from "../store/queue";
import { rabbitMgmt } from "../test-helpers";
import params, { testId } from "../test-params";
import updateUsage from "./update-usage";

describe("update-usage", () => {
  beforeAll(async () => {
    await rabbitMgmt.createVhost(testId);
  });

  afterAll(async () => {
    await rabbitMgmt.deleteVhost(testId);
  });

  let originalInitClient: typeof appRouter.initClients;
  let initClientsSpy: jest.SpyInstance;
  let reportUsageSpy: jest.SpyInstance;
  let queue: Queue;

  beforeEach(() => {
    originalInitClient = appRouter.initClients;
    initClientsSpy = jest
      .spyOn(appRouter, "initClients")
      .mockImplementation(async (params, name) => {
        const result = await originalInitClient(params, name);
        queue = result.queue;
        return result;
      });
    reportUsageSpy = jest
      .spyOn(stripeController, "reportUsage")
      .mockResolvedValue({ updatedUsers: [{ id: "test" }] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cache.storage = null;
    queue?.close();
    queue = null;
  });

  it("should not call initClients if clients are passed", async () => {
    const clients = await originalInitClient(params);
    try {
      await updateUsage(params, clients);

      expect(initClientsSpy).not.toHaveBeenCalled();
    } finally {
      await clients.queue.close();
    }
  });

  it("calls stripe reportUsage", async () => {
    const { updatedUsers } = await updateUsage(params);

    expect(updatedUsers).toEqual([{ id: "test" }]);
    expect(reportUsageSpy).toHaveBeenCalledTimes(1);
  });
});
