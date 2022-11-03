import { ConsumeMessage } from "amqplib";
import { db } from "../store";
import messages from "../store/messages";
import Queue from "../store/queue";
import { Asset, Task } from "../schema/types";
import { v4 as uuid } from "uuid";
import { WithID } from "../store/types";
import { taskOutputToIpfsStorage } from "../store/asset-table";
import { RoutingKey } from "../store/queue";
import { EventKey } from "../store/webhook-table";
import { sleep } from "../util";

const taskInfo = (task: Task): messages.TaskInfo => ({
  id: task.id,
  type: task.type,
  snapshot: task,
});

const MAX_RETRIES = 2;
const TASK_RETRY_BASE_DELAY = 30 * 1000;

export class TaskScheduler {
  queue: Queue;
  running: boolean;

  constructor() {
    // initialized through start to allow for singleton instance
  }

  async start({ queue }) {
    if (this.running) {
      throw new Error("task scheduler already running");
    }
    this.running = true;
    this.queue = queue;
    await this.queue.consume("task", this.handleTaskQueue.bind(this));
  }

  stop() {
    // this.db.queue.unsetMsgHandler();
    this.running = false;
  }

  async handleTaskQueue(data: ConsumeMessage) {
    let event: messages.TaskResult;
    try {
      event = JSON.parse(data.content.toString());
      console.log(
        "events: got task result message",
        JSON.stringify(event, null, 2)
      );
    } catch (err) {
      console.log("events: error parsing task message", err);
      this.queue.ack(data);
      return;
    }

    let ack: boolean;
    try {
      ack = await this.processTaskEvent(event);
    } catch (err) {
      ack = true;
      console.log("handleTaskQueue Error ", err);
    } finally {
      if (ack) {
        this.queue.ack(data);
      } else {
        setTimeout(() => this.queue.nack(data), 1000);
      }
    }
  }

  async processTaskEvent(event: messages.TaskResult): Promise<boolean> {
    const tasks = await db.task.find({ id: event.task.id });
    if (!tasks?.length || !tasks[0].length) {
      console.log(`task event process error: task ${event.task.id} not found`);
      return true;
    }
    const task = tasks[0][0];

    // TODO: bundle all db updates in a single transaction
    if (event.error) {
      if (
        !event.error.unretriable &&
        (task.status.retries ?? 0) < MAX_RETRIES
      ) {
        await this.retryTask(task, event.error.message);
      } else {
        if (task.status.retries) {
          console.log(
            `task retry process error: err=max retries reached taskId=${task.id}`
          );
        }
        await this.failTask(task, event.error.message);
      }
      console.log(
        `task event process error: err="${event.error.message}" unretriable=${event.error.unretriable}`
      );
      return true;
    }

    let assetSpec: Asset;
    switch (event.task.type) {
      case "import":
      case "upload":
        assetSpec = event.output?.import?.assetSpec;
        if (!assetSpec) {
          const error = "bad task output: missing assetSpec";
          console.error(
            `task event process error: err=${error} taskId=${event.task.id}`
          );
          await this.failTask(task, error, event.output);
          return true;
        }
        await this.updateAsset(task.outputAssetId, {
          size: assetSpec.size,
          hash: assetSpec.hash,
          videoSpec: assetSpec.videoSpec,
          files: assetSpec.files,
          playbackRecordingId: assetSpec.playbackRecordingId,
          status: {
            phase: "ready",
            updatedAt: Date.now(),
          },
        });
        break;
      case "transcode":
        assetSpec = event.output?.transcode?.asset?.assetSpec;
        if (!assetSpec) {
          const error = "bad task output: missing assetSpec";
          console.error(
            `task event process error: err=${error} taskId=${event.task.id}`
          );
          await this.failTask(task, error, event.output);
          return true;
        }
        await this.updateAsset(task.outputAssetId, {
          size: assetSpec.size,
          hash: assetSpec.hash,
          videoSpec: assetSpec.videoSpec,
          playbackRecordingId: assetSpec.playbackRecordingId,
          status: {
            phase: "ready",
            updatedAt: Date.now(),
          },
        });
        break;
      case "export":
        const inputAsset = await db.asset.get(task.inputAssetId);
        if (inputAsset.storage?.status?.tasks.pending === task.id) {
          await this.updateAsset(inputAsset, {
            storage: {
              ...inputAsset.storage,
              ipfs: {
                spec: inputAsset.storage.ipfs.spec,
                ...taskOutputToIpfsStorage(event.output.export.ipfs),
                updatedAt: Date.now(),
              },
              status: {
                phase: "ready",
                tasks: { last: task.id },
              },
            },
          });
        }
        break;
    }
    await this.updateTask(task, {
      status: {
        phase: "completed",
        updatedAt: Date.now(),
      },
      output: event.output,
    });
    return true;
  }

  private async failTask(
    task: WithID<Task>,
    error: string,
    output?: Task["output"]
  ) {
    const baseStatus: Task["status"] & Asset["status"] = {
      phase: "failed",
      updatedAt: Date.now(),
      errorMessage: error,
    };
    await this.updateTask(task, {
      output,
      status: {
        ...baseStatus,
        retries: task.status.retries,
      },
    });
    if (task.outputAssetId) {
      await this.updateAsset(task.outputAssetId, { status: baseStatus });
    }
    switch (task.type) {
      case "export":
        const inputAsset = await db.asset.get(task.inputAssetId);
        const storageTasks = inputAsset.storage?.status?.tasks;
        if (storageTasks?.pending === task.id) {
          let prevSpec: Asset["storage"]["ipfs"]["spec"];
          if (storageTasks.last) {
            const prevTask = await db.task.get(storageTasks.last);
            prevSpec = (prevTask.params?.export as any).ipfs;
          }
          await this.updateAsset(inputAsset, {
            storage: {
              ...inputAsset.storage,
              ipfs: {
                ...inputAsset.storage.ipfs,
                spec: prevSpec ?? inputAsset.storage.ipfs.spec,
              },
              status: {
                phase: prevSpec ? "reverted" : "failed",
                errorMessage: error,
                tasks: {
                  last: inputAsset.storage.status.tasks.last,
                  failed: task.id,
                },
              },
            },
          });
        }
        break;
    }
  }

  async scheduleTask(
    type: Task["type"],
    params: Task["params"],
    inputAsset?: Asset,
    outputAsset?: Asset
  ) {
    const task = await this.spawnTask(type, params, inputAsset, outputAsset);
    await this.enqueueTask(task);
    return task;
  }

  async spawnTask(
    type: Task["type"],
    params: Task["params"],
    inputAsset?: Asset,
    outputAsset?: Asset
  ) {
    const task = await db.task.create({
      id: uuid(),
      createdAt: Date.now(),
      type: type,
      outputAssetId: outputAsset?.id,
      inputAssetId: inputAsset?.id,
      userId: inputAsset?.userId || outputAsset?.userId,
      params,
      status: {
        phase: "pending",
        updatedAt: Date.now(),
      },
    });
    await this.queue.publishWebhook("events.task.spawned", {
      type: "webhook_event",
      id: uuid(),
      timestamp: task.createdAt,
      event: "task.spawned",
      userId: task.userId,
      payload: {
        task: taskInfo(task),
      },
    });
    return task;
  }

  async enqueueTask(task: WithID<Task>) {
    const status: Task["status"] = {
      phase: "waiting",
      updatedAt: Date.now(),
      retries: task.status.retries,
    };
    await this.queue.publish("task", `task.trigger.${task.type}.${task.id}`, {
      type: "task_trigger",
      id: uuid(),
      timestamp: status.updatedAt,
      task: taskInfo(task),
    });
    await this.updateTask(task, { status });
  }

  async retryTask(task: WithID<Task>, errorMessage: string) {
    let retries = (task.status.retries ?? 0) + 1;
    const status: Task["status"] = {
      phase: "waiting",
      updatedAt: Date.now(),
      retries: retries,
      errorMessage,
    };

    task = await this.updateTask(task, { status });
    await sleep(retries * TASK_RETRY_BASE_DELAY);
    await this.enqueueTask(task);
  }

  async updateTask(
    task: WithID<Task>,
    updates: Pick<Task, "status" | "output">
  ) {
    await db.task.update(task.id, updates);
    task = {
      ...task,
      ...updates,
    };
    const timestamp = task.status.updatedAt;
    await this.queue.publishWebhook("events.task.updated", {
      type: "webhook_event",
      id: uuid(),
      timestamp,
      event: "task.updated",
      userId: task.userId,
      payload: {
        task: taskInfo(task),
      },
    });
    if (task.status.phase === "completed" || task.status.phase === "failed") {
      let taskEvent: EventKey = `task.${task.status.phase}`;
      let routingKey: RoutingKey = `events.${taskEvent}`;
      await this.queue.publishWebhook(routingKey, {
        type: "webhook_event",
        id: uuid(),
        timestamp,
        event: taskEvent,
        userId: task.userId,
        payload: {
          success: task.status.phase === "completed",
          task: taskInfo(task),
        },
      });
    }
    return task;
  }

  async deleteAsset(asset: string | Asset) {
    if (typeof asset === "string") {
      asset = await db.asset.get(asset);
    }
    await db.asset.markDeleted(asset.id);
    await this.queue.publishWebhook("events.asset.deleted", {
      type: "webhook_event",
      id: uuid(),
      timestamp: Date.now(),
      event: "asset.deleted",
      userId: asset.userId,
      payload: {
        asset: {
          id: asset.id,
          snapshot: asset,
        },
      },
    });
  }

  async updateAsset(asset: string | Asset, updates: Partial<Asset>) {
    if (typeof asset === "string") {
      asset = await db.asset.get(asset);
    }
    const statusChanged =
      updates.status && asset.status.phase !== updates.status.phase;
    if (!updates.status) {
      updates = {
        ...updates,
        status: { ...asset.status, updatedAt: Date.now() },
      };
    }
    await db.asset.update(asset.id, updates);
    asset = {
      ...asset,
      ...updates,
    };
    const timestamp = asset.status.updatedAt;
    await this.queue.publishWebhook("events.asset.updated", {
      type: "webhook_event",
      id: uuid(),
      timestamp,
      event: "asset.updated",
      userId: asset.userId,
      payload: {
        asset: {
          id: asset.id,
          snapshot: asset,
        },
      },
    });
    const newPhase = asset.status.phase;
    if (statusChanged && (newPhase === "ready" || newPhase === "failed")) {
      let assetEvent: EventKey = `asset.${newPhase}`;
      let routingKey: RoutingKey = `events.${assetEvent}`;
      await this.queue.publishWebhook(routingKey, {
        type: "webhook_event",
        id: uuid(),
        timestamp,
        event: assetEvent,
        userId: asset.userId,
        payload: {
          id: asset.id,
          snapshot: asset,
        },
      });
    }
  }
}

const taskScheduler = new TaskScheduler();
export default taskScheduler;
