import { ConsumeMessage } from "amqplib";
import { db } from "../store";
import messages from "../store/messages";
import Queue from "../store/queue";
import { Asset, Task } from "../schema/types";
import { v4 as uuid } from "uuid";
import { WithID } from "../store/types";
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
      console.log("events: got task result message", event);
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
    const allowedTasks = ["import", "export", "transcode"];

    let obj = await db.task.find({ id: event.task.id });
    if (obj?.length) {
      let task = obj[0][0];
      if (event.error) {
        db.task.update(task.id, {
          status: {
            errorMessage: event.error.message,
            phase: "failed",
          },
          updatedAt: Date.now(),
        });
        if (!event.error.unretriable) {
          console.log(`task event process error: ${event.error.message}`);
          return true;
        }
        // TODO: retry task
        return true;
      }

      if (event.task.type == "import") {
        if (event.output) {
          let assetSpec;
          try {
            assetSpec = event.output.import.assetSpec;
          } catch (e) {
            console.log(
              `task event process error: assetSpec not found in TaskResult for task ${event.task.id}`
            );
          }
          // TODO: bundle asset and task update in a single transaction
          await db.asset.update(task.parentAssetId, {
            hash: assetSpec.hash,
            videoSpec: assetSpec.videoSpec,
            size: assetSpec.size,
            originTaskId: task.id,
            status: "ready",
          });

          return true;
        }
      }

      await db.task.update(task.id, {
        status: {
          phase: "completed",
          updatedAt: Date.now(),
        },
        output: event.output,
      });
    } else {
      console.log(`task event process error: task ${event.task.id} not found`);
      return true;
    }
    return false;
  }

  async scheduleTask(
    asset: Asset,
    type: "import" | "export" | "transcode",
    params: object
  ) {
    let newTask: WithID<Task> = {
      id: uuid(),
      name: `asset-upload-${asset.name}-${asset.createdAt}`,
      createdAt: Date.now(),
      type: type,
      parentAssetId: asset.id,
      userId: asset.userId,
      params: {},
      status: {
        phase: "pending",
        updatedAt: Date.now(),
      },
    };

    newTask.params[type] = params;

    let task = await db.task.create(newTask);
    await this.queue.publish("task", `task.trigger.${task.type}.${task.id}`, {
      type: "task_trigger",
      id: uuid(),
      timestamp: Date.now(),
      task: {
        id: task.id,
        type: task.type,
        snapshot: task,
      },
    });

    await db.task.update(task.id, {
      status: { phase: "waiting", updatedAt: Date.now() },
    });

    return task;
  }
}
