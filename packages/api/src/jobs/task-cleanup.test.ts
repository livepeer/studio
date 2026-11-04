import { taskScheduler } from "../task/scheduler";
import { DB } from "../store/db";
import Queue from "../store/queue";
import taskCleanup from "./task-cleanup";

jest.mock("../task/scheduler", () => ({
  taskScheduler: {
    config: undefined,
    queue: undefined,
    failTask: jest.fn().mockResolvedValue(true),
  },
}));

describe("task-cleanup", () => {
  it("fails stale enqueued tasks with a waiting-phase guard", async () => {
    const staleTasks = [
      { id: "task-1", status: { phase: "waiting", retries: undefined } },
      { id: "task-2", status: { phase: "waiting", retries: undefined } },
    ];
    const jobsDb = {
      task: {
        findStaleEnqueuedTasks: jest.fn().mockResolvedValue(staleTasks),
      },
    } as unknown as DB;
    const queue = {} as Queue;
    const config = { taskCleanupLimit: 10 } as any;

    await expect(taskCleanup(config, { jobsDb, queue })).resolves.toEqual({
      cleanedUp: 2,
      logContext: "limit=10 numCleanedUp=2",
    });

    expect(jobsDb.task.findStaleEnqueuedTasks).toHaveBeenCalledWith(10);
    expect(taskScheduler.config).toBe(config);
    expect(taskScheduler.queue).toBe(queue);
    expect(taskScheduler.failTask).toHaveBeenNthCalledWith(
      1,
      staleTasks[0],
      "Task expired while waiting to run",
      undefined,
      { allowedPhases: ["waiting"] },
    );
    expect(taskScheduler.failTask).toHaveBeenCalledTimes(2);
  });
});
