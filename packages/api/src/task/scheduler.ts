import { ConsumeMessage } from "amqplib";
import { db } from "../store";
import messages from "../store/messages";
import Queue from "../store/queue";
import { Asset, Task } from "../schema/types";
import { v4 as uuid } from "uuid";
import { WithID } from "../store/types";
import { mergeAssetStatus } from "../store/asset-table";

const taskInfo = (task: Task): messages.TaskInfo => ({
  id: task.id,
  type: task.type,
  snapshot: task,
});

export default class TaskScheduler {
  queue: Queue;
  running: boolean;
  constructor({ queue }) {
    this.running = true;
    this.queue = queue;
  }
  async start() {
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
      await this.failTask(task, event.error.message);
      // TODO: retry task
      console.log(
        `task event process error: err="${event.error.message}" unretriable=${event.error.unretriable}`
      );
      return true;
    }

    let assetSpec: Asset;
    switch (event.task.type) {
      case "import":
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
        if (inputAsset.status.storage?.ipfs?.taskIds?.pending === task.id) {
          await this.updateAsset(inputAsset, {
            status: mergeAssetStatus(inputAsset.status, {
              storage: {
                ipfs: {
                  taskIds: {
                    pending: undefined,
                    last: task.id,
                  },
                  data: event.output.export.ipfs,
                },
              },
            }),
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

  private async failTask(task: Task, error: string, output?: Task["output"]) {
    const status = {
      phase: "failed",
      updatedAt: Date.now(),
      errorMessage: error,
    } as const;
    await this.updateTask(task, {
      output,
      status,
    });
    if (task.outputAssetId) {
      await this.updateAsset(task.outputAssetId, { status });
    }
    switch (task.type) {
      case "export":
        const inputAsset = await db.asset.get(task.inputAssetId);
        if (inputAsset.status?.storage?.ipfs?.taskIds?.pending === task.id) {
          await this.updateAsset(inputAsset, {
            status: mergeAssetStatus(inputAsset.status, {
              storage: {
                ipfs: {
                  taskIds: {
                    pending: undefined,
                    failed: task.id,
                  },
                },
              },
            }),
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
    const task = await this.createTask(type, params, inputAsset, outputAsset);
    await this.enqueueTask(task);
    return task;
  }

  async createTask(
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
    await this.queue.publishWebhook("events.task.created", {
      type: "webhook_event",
      id: uuid(),
      timestamp: task.createdAt,
      event: "task.created",
      userId: task.userId,
      payload: {
        task: taskInfo(task),
      },
    });
    return task;
  }

  async enqueueTask(task: WithID<Task>) {
    const status: Task["status"] = { phase: "waiting", updatedAt: Date.now() };
    await this.queue.publish("task", `task.trigger.${task.type}.${task.id}`, {
      type: "task_trigger",
      id: uuid(),
      timestamp: status.updatedAt,
      task: taskInfo(task),
    });
    await this.updateTask(task, { status });
  }

  async updateTask(task: Task, updates: Pick<Task, "status" | "output">) {
    await db.task.update(task.id, updates);
    task = {
      ...task,
      ...updates,
    };
    const timestamp = task.status.updatedAt;
    await this.queue.publishWebhook("events.task.status", {
      type: "webhook_event",
      id: uuid(),
      timestamp,
      event: "task.status",
      userId: task.userId,
      payload: {
        task: taskInfo(task),
      },
    });
    if (task.status.phase === "completed" || task.status.phase === "failed") {
      await this.queue.publishWebhook("events.task.finished", {
        type: "webhook_event",
        id: uuid(),
        timestamp,
        event: "task.finished",
        userId: task.userId,
        payload: {
          success: task.status.phase === "completed",
          task: taskInfo(task),
        },
      });
    }
  }

  async updateAsset(
    asset: string | Asset,
    updates: Partial<Asset> & Required<Pick<Asset, "status">>
  ) {
    if (typeof asset === "string") {
      asset = await db.asset.get(asset);
    }
    await db.asset.update(asset.id, updates);
    if (!updates.status || updates.status === asset.status) {
      return;
    }
    asset = {
      ...asset,
      ...updates,
    };
    const timestamp = asset.status.updatedAt;
    await this.queue.publishWebhook("events.asset.status", {
      type: "webhook_event",
      id: uuid(),
      timestamp,
      event: "asset.status",
      userId: asset.userId,
      payload: {
        asset: {
          id: asset.id,
          snapshot: asset,
        },
      },
    });
  }
}
