import * as appRouter from "../app-router";
import * as stripeController from "../controllers/stripe";
import { cache } from "../store/cache";
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

  let reportUsageSpy: jest.SpyInstance;

  beforeEach(() => {
    reportUsageSpy = jest
      .spyOn(stripeController, "reportUsage")
      .mockResolvedValue({ updatedUsers: [{ id: "test" }] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cache.storage = null;
  });

  it("should not call initClients if clients are passed", async () => {
    const clients = await appRouter.initClients(params);
    const initSpy = jest.spyOn(appRouter, "initClients");

    await updateUsage(params, clients);
    expect(initSpy).not.toHaveBeenCalled();
  });

  it("calls stripe reportUsage", async () => {
    const { updatedUsers } = await updateUsage(params);

    expect(updatedUsers).toEqual([{ id: "test" }]);
    expect(reportUsageSpy).toHaveBeenCalledTimes(1);
  });
});
