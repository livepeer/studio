import { ConsumeMessage } from "amqplib";
import sql from "sql-template-strings";
import { v4 as uuid } from "uuid";
import { toExternalAsset } from "../controllers/asset";
import { toExternalSession } from "../controllers/session";
import {
  taskParamsWithoutCredentials,
  toExternalTask,
} from "../controllers/task";
import { CliArgs } from "../parse-cli";
import { Asset, Task, User } from "../schema/types";
import { jobsDb as db } from "../store"; // use only the jobs DB pool on queue logic
import { taskOutputToIpfsStorage } from "../store/asset-table";
import { TooManyRequestsError } from "../store/errors";
import messages from "../store/messages";
import Queue, { RoutingKey } from "../store/queue";
import { WithID } from "../store/types";
import { EventKey } from "../store/webhook-table";
import { sleep } from "../util";

const taskInfo = (task: WithID<Task>, config: CliArgs): messages.TaskInfo => ({
  id: task.id,
  type: task.type,
  snapshot: toExternalTask(task, config),
});

function sqlQueryGroup(values: string[]) {
  const query = sql`(`;
  values.forEach((value, i) => {
    if (i) query.append(`, `);
    query.append(sql`${value}`);
  });
  query.append(`)`);
  return query;
}

const MAX_RETRIES = 2;
const TASK_RETRY_BASE_DELAY = 30 * 1000;
const TASK_FINAL_RETRY_DELAY = 3 * 60 * 1000;

export class TaskScheduler {
  config: CliArgs;
  queue: Queue;
  running: boolean;

  constructor() {
    // no-args contruction on start up to allow for singleton instance
  }

  async start(config: CliArgs, queue: Queue) {
    if (this.running) {
      throw new Error("task scheduler already running");
    }
    this.running = true;
    this.config = config;
    this.queue = queue;

    await this.queue.consume("task", this.handleTaskQueue.bind(this));
  }

  stop() {
    // this.db.queue.unsetMsgHandler();
    this.running = false;
  }

  async handleTaskQueue(data: ConsumeMessage) {
    let event: messages.TaskResult | messages.TaskResultPartial;
    try {
      event = JSON.parse(data.content.toString());
      console.log(
        "events: got task result message",
        JSON.stringify(event, null, 2),
      );
    } catch (err) {
      console.log("events: error parsing task message", err);
      this.queue.ack(data);
      return;
    }

    let ack: boolean;
    try {
      if (event.type === "task_result") {
        ack = await this.processTaskEvent(event);
      } else if (event.type === "task_result_partial") {
        ack = await this.processTaskResultPartial(event);
      } else {
        throw new Error("unknown event type: " + (event as any).type);
      }
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
    const task = await db.task.get(event.task.id, { useReplica: false });
    if (!task || task?.deleted) {
      console.log(
        `task event process error: task ${event.task.id} ${
          task ? "is deleted" : "not found"
        } in process task event`,
      );
      return true;
    }

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
            `task retry process error: err=max retries reached taskId=${task.id}`,
          );
        }
        await this.failTask(task, event.error.message);
      }
      console.log(
        `task event process error: err="${event.error.message}" unretriable=${event.error.unretriable}`,
      );
      return true;
    }

    let assetSpec: Asset;
    switch (task.type) {
      case "clip":
      case "upload":
        assetSpec = event.output?.[task.type]?.assetSpec;
        if (!assetSpec) {
          const error = "bad task output: missing assetSpec";
          console.error(
            `task event process error: err=${error} taskId=${event.task.id}`,
          );
          await this.failTask(task, error, event.output);
          return true;
        }
        let phase: Asset["status"]["phase"] = "ready";
        const asset = await db.asset.get(task.outputAssetId);
        if (asset.status?.phase === "deleting") {
          phase = "deleting";
        }
        await this.updateAsset(task.outputAssetId, {
          size: assetSpec.size,
          hash: assetSpec.hash,
          videoSpec: assetSpec.videoSpec,
          files: assetSpec.files,
          storage: !assetSpec.storage?.ipfs
            ? undefined
            : {
                ...assetSpec.storage,
                status: {
                  tasks: { last: task.id },
                  phase: "ready",
                },
              },
          playbackRecordingId: assetSpec.playbackRecordingId,
          status: {
            phase,
            updatedAt: Date.now(),
          },
        });
        await this.triggerRecordingReadyWebhook(task);
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
      case "export-data":
        if (task.params.exportData.type === "attestation") {
          db.attestation.update(task.params.exportData.id, {
            storage: {
              ipfs: {
                cid: event.output.exportData.ipfs.cid,
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

  async processTaskResultPartial(
    event: messages.TaskResultPartial,
  ): Promise<boolean> {
    const task = await db.task.get(event.task.id, { useReplica: false });
    if (!task || task?.deleted) {
      console.log(
        `task event process error: task ${event.task.id} ${
          task ? "is deleted" : "not found"
        } in process task result partial`,
      );
      return true;
    }

    const asset = await db.asset.get(task.outputAssetId);
    await this.updateAsset(task.outputAssetId, {
      sourcePlaybackReady: true,
      files: event.output.upload.assetSpec.files,
      status: {
        ...asset.status,
        updatedAt: Date.now(),
      },
    });
    await this.updateTask(task, {
      sourceReadyAt: Date.now(),
      status: {
        ...task.status,
        updatedAt: Date.now(),
      },
    });
    return true;
  }

  async triggerRecordingReadyWebhook(task: Task) {
    if (task.outputAssetId) {
      const asset = await db.asset.get(task.outputAssetId);
      if (asset && asset.source.type == "recording" && asset.source.sessionId) {
        const session = await db.session.get(asset.source.sessionId);
        if (session) {
          const externalSession = await toExternalSession(
            this.config,
            session,
            null,
            true,
          );
          await this.queue.publishWebhook("events.recording.ready", {
            type: "webhook_event",
            id: uuid(),
            timestamp: Date.now(),
            streamId: session.parentId,
            event: "recording.ready",
            userId: session.userId,
            projectId: session.projectId,
            sessionId: session.id,
            payload: {
              recordingUrl: externalSession?.recordingUrl,
              mp4Url: externalSession?.mp4Url,
              session: {
                ...externalSession,
                recordingStatus: "ready",
                assetId: session.id,
              },
            },
          });
        }
      }
    }
  }

  public async failTask(
    task: WithID<Task>,
    error: string,
    output?: Task["output"],
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
      case "export-data":
        if (task.params.exportData.type === "attestation") {
          db.attestation.update(task.params.exportData.id, {
            storage: {
              status: {
                phase: "failed",
                tasks: { failed: task.id },
              },
            },
          });
        }
        break;
    }
  }

  async createAndScheduleTask(
    type: Task["type"],
    params: Task["params"],
    user: User,
    inputAsset?: Asset,
    outputAsset?: Asset,
    requesterId?: string,
  ) {
    const projectId =
      inputAsset?.projectId || outputAsset?.projectId || user?.defaultProjectId;
    const task = await this.createTask(
      type,
      params,
      user,
      projectId,
      inputAsset,
      outputAsset,
      requesterId,
    );

    await this.scheduleTask(task);
    return task;
  }

  async createTask(
    type: Task["type"],
    params: Task["params"],
    user: User,
    projectId: string,
    inputAsset?: Asset,
    outputAsset?: Asset,
    requesterId?: string,
  ) {
    const task = await db.task.create({
      id: uuid(),
      createdAt: Date.now(),
      type: type,
      outputAssetId: outputAsset?.id,
      inputAssetId: inputAsset?.id,
      userId: user.id,
      params,
      status: {
        phase: "pending",
        updatedAt: Date.now(),
      },
      projectId,
      requesterId,
    });
    await this.queue.publishWebhook("events.task.spawned", {
      type: "webhook_event",
      id: uuid(),
      timestamp: task.createdAt,
      event: "task.spawned",
      userId: task.userId,
      payload: {
        task: taskInfo(task, this.config),
      },
      projectId: task.projectId || user.defaultProjectId,
    });
    return task;
  }

  async scheduleTask(task: WithID<Task>, retries = 0) {
    const timestamp = Date.now();
    try {
      await this.updateTask(task, {
        // only update scheduledAt on the first schedule (retries == 0)
        scheduledAt: retries ? undefined : timestamp,
        status: {
          phase: "waiting",
          updatedAt: timestamp,
          retries,
        },
      });

      await this.queue.publish("task", `task.trigger.${task.type}.${task.id}`, {
        type: "task_trigger",
        id: uuid(),
        timestamp,
        task: taskInfo(task, this.config),
      });
    } catch (err) {
      console.error(`Failed to enqueue task: taskId=${task.id} err=`, err);
      this.failTask(task, "Failed to enqueue task").catch((err) =>
        console.error(
          `Error failing task after enqueue error: taskId=${task.id} err=`,
          err,
        ),
      );
      throw new Error(`Failed to enqueue task: ${err}`);
    }
  }

  async retryTask(
    task: WithID<Task>,
    errorMessage: string,
    forceRetry?: boolean,
  ) {
    let retries = (task.status.retries ?? 0) + 1;
    if (forceRetry) {
      retries = 0;
    }
    const status: Task["status"] = {
      phase: "waiting",
      updatedAt: Date.now(),
      retries: retries,
      errorMessage,
    };

    task = await this.updateTask(task, { status });
    if (forceRetry) {
      await this.scheduleTask(task, retries);
      return;
    }

    const sleepDur =
      retries == MAX_RETRIES
        ? TASK_FINAL_RETRY_DELAY
        : retries * TASK_RETRY_BASE_DELAY;
    await sleep(sleepDur);
    await this.scheduleTask(task, retries);
  }

  async updateTask(
    task: WithID<Task>,
    updates: Pick<Task, "scheduledAt" | "status" | "output" | "sourceReadyAt">,
    filters?: { allowedPhases: Array<Task["status"]["phase"]> },
  ) {
    updates = this.deleteCredentials(task, updates);
    let query = [sql`id = ${task.id}`];
    if (filters?.allowedPhases) {
      query.push(
        sql`data->'status'->>'phase' IN `.append(
          sqlQueryGroup(filters.allowedPhases),
        ),
      );
    }
    const res = await db.task.update(query, updates);
    if (!res?.rowCount) {
      return;
    }
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
        task: taskInfo(task, this.config),
      },
      projectId: task.projectId,
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
          task: taskInfo(task, this.config),
        },
        projectId: task.projectId,
      });
    }
    return task;
  }

  private deleteCredentials(
    task: WithID<Task>,
    updates: Pick<Task, "status" | "output" | "params">,
  ): Pick<Task, "status" | "output" | "params"> {
    // We should remove this at some point and do not store credentials at all
    const isTerminal =
      updates?.status.phase === "completed" ||
      updates?.status.phase === "failed";
    if (!isTerminal) {
      return updates;
    }

    return {
      ...updates,
      params: taskParamsWithoutCredentials(task.type, task.params),
    };
  }

  async deleteAsset(asset: string | Asset) {
    try {
      if (typeof asset === "string") {
        asset = await db.asset.get(asset);
      }
      await this.updateAsset(asset, {
        deleted: true,
        deletedAt: Date.now(),
        status: {
          phase: "deleting",
          updatedAt: Date.now(),
        },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async restoreAsset(asset: string | Asset) {
    try {
      if (typeof asset === "string") {
        asset = await db.asset.get(asset);
      }

      await this.updateAsset(asset, {
        deleted: false,
        deletedAt: null,
        status: {
          phase: "ready",
          updatedAt: Date.now(),
        },
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async updateAsset(
    asset: string | Asset,
    updates: Partial<Asset>,
    filters?: { allowedPhases: Array<Asset["status"]["phase"]> },
  ) {
    if (typeof asset === "string") {
      asset = await db.asset.get(asset, { useReplica: false });
    }
    const phaseChanged =
      updates.status && asset.status.phase !== updates.status.phase;
    if (!updates.status) {
      updates = {
        ...updates,
        status: { ...asset.status, updatedAt: Date.now() },
      };
    }
    let query = [sql`id = ${asset.id}`];
    if (filters?.allowedPhases) {
      query.push(
        sql`data->'status'->>'phase' IN `.append(
          sqlQueryGroup(filters.allowedPhases),
        ),
      );
    }
    const event = updates.deleted ? "asset.deleted" : "asset.updated";
    const publishWebhook = async (asset: Asset, event: EventKey) => {
      const snapshot = await toExternalAsset(asset, this.config, true);
      const timestamp = Date.now();
      await this.queue.publishWebhook(`events.${event}`, {
        type: "webhook_event",
        id: uuid(),
        timestamp,
        event,
        userId: asset.userId,
        projectId: asset.projectId,
        payload: {
          asset: {
            id: asset.id,
            snapshot,
          },
        },
      });
    };

    const res = await db.asset.update(query, updates);
    if (!res?.rowCount) {
      return;
    }

    if (event === "asset.deleted") {
      await publishWebhook(asset, event);
    }

    asset = { ...asset, ...updates };

    if (event === "asset.deleted") {
      return;
    }

    await publishWebhook(asset, event);

    const newPhase = asset.status.phase;
    if (phaseChanged && (newPhase === "ready" || newPhase === "failed")) {
      let assetEvent: EventKey = `asset.${newPhase}`;
      await publishWebhook(asset, assetEvent);
    }
  }
}

export async function ensureQueueCapacity(config: CliArgs, userId: string) {
  const numScheduled = await db.task.countScheduledTasks(userId);
  if (numScheduled >= config.vodMaxScheduledTasksPerUser) {
    throw new TooManyRequestsError(
      `user ${userId} has reached the maximum number of pending tasks`,
    );
  }
}

export const taskScheduler = new TaskScheduler();
