import { jobFuncs, runJob } from ".";

describe("runJob", () => {
  let mockExit: jest.SpyInstance;
  let jobMockFn: jest.Mock;

  beforeAll(() => {
    mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);
  });

  beforeEach(() => {
    jobFuncs["create-db-tables"] = jobMockFn = jest.fn(() => Promise.resolve());
  });

  it("calls the corresponding job function", async () => {
    await runJob("create-db-tables", { jobTimeoutSec: 1 } as any);
    expect(jobMockFn).toHaveBeenCalledTimes(1);
  });

  it("exits with status 0 on success", async () => {
    await runJob("create-db-tables", { jobTimeoutSec: 1 } as any);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it("respects timeout configuration", async () => {
    jobMockFn.mockImplementation(() => new Promise(() => {})); // never resolved
    const startTime = Date.now();
    await runJob("create-db-tables", { jobTimeoutSec: 1 } as any);
    const elapsedTime = Date.now() - startTime;
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(elapsedTime).toBeGreaterThanOrEqual(1000);
  });

  it("catches errors and exits with status 1", async () => {
    jobMockFn.mockRejectedValue(new Error("job failed"));
    await runJob("create-db-tables", { jobTimeoutSec: 1 } as any);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
