import { Asset, Task as ApiTask, User } from "../schema/types";
import { DBStream } from "./stream-table";
import { WithID } from "./types";
import { DBWebhook, EventKey } from "./webhook-table";

namespace messages {
  export type Any = Webhooks | Task;
  export type Webhooks = WebhookEvent | WebhookTrigger;
  export type Task = TaskTrigger | TaskResult;
  export type Types = Any["type"];

  // This is a global format followed by all messages sent by Livepeer services
  // to the message broker (RabbitMQ as of writing this).
  export interface Base {
    // Type should be unique for each message schema, indicating what object
    // type to parse and interpret the message data into.
    type: Types;
    // ID is generally a randomly generated UUID.
    id: string;
    // Unix timestamp in milliseconds.
    timestamp: number;
    // ID of the stream as defined by the API in the authWebhook (ID from DB).
    streamId?: string;
  }

  type TPayload = {
    readonly [key: string]: any;
  };

  export interface WebhookEvent extends Base {
    type: "webhook_event";
    event: EventKey;
    userId: string;
    sessionId?: string;
    // Additional information about the event to be sent to the user on the
    // webhook request.
    payload?: TPayload;
  }

  export interface WebhookTrigger extends Base {
    type: "webhook_trigger";
    event: WebhookEvent;
    user: WithID<User>;
    webhook: DBWebhook;
    stream: DBStream;
    retries?: number;
    lastInterval?: number;
  }

  type TaskInfo = {
    id: string;
    type: ApiTask["type"];
    snapshot: ApiTask;
  };

  export interface TaskTrigger extends Base {
    type: "task_trigger";
    task: TaskInfo;
  }

  export interface TaskResult extends Base {
    type: "task_result";
    task: TaskInfo;
    error: {
      message: string;
      unretriable: boolean;
    };
    output: {
      import: {
        videoFilePath: string;
        metadataFilePath: string;
        metadata: any;
        assetSpec: Partial<Asset>;
      };
    };
  }
}

export default messages;
