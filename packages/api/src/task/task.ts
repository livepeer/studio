import { ConsumeMessage } from "amqplib";
import { db } from "../store";
import messages from "../store/messages";
import Queue from "../store/queue";

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

          db.asset.update(task.parentAssetId, {
            hash: assetSpec.hash,
            videoSpec: assetSpec.videoSpec,
            size: assetSpec.size,
            originTaskId: task.id,
            status: "ready",
          });

          db.task.update(task.id, {
            status: {
              phase: "completed",
            },
          });
          return true;
        }
      }
      console.log(`task type unknown: ${event.task.type}`);
    } else {
      console.log(`task event process error: task ${event.task.id} not found`);
      return true;
    }
    return false;
  }
}
