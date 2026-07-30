import { initClients } from "../app-router";
import { CliArgs } from "../parse-cli";
import { taskScheduler } from "../task/scheduler";
import Queue from "../store/queue";
import { DB } from "../store/db";

export default async function taskCleanup(
  config: CliArgs,
  clients?: { jobsDb: DB; queue: Queue },
) {
  const { jobsDb, queue } =
    clients ?? (await initClients(config, "task-cleanup-job"));
  const tasks = await jobsDb.task.findStaleEnqueuedTasks(
    config.taskCleanupLimit,
  );

  taskScheduler.config = config;
  taskScheduler.queue = queue;

  let cleanedUp = 0;
  for (const task of tasks) {
    const failed = await taskScheduler.failTask(
      task,
      "Task expired while waiting to run",
      undefined,
      { allowedPhases: ["waiting"] },
    );
    if (failed) {
      cleanedUp += 1;
    }
  }

  return {
    cleanedUp,
    logContext: `limit=${config.taskCleanupLimit} numCleanedUp=${cleanedUp}`,
  };
}
