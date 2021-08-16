import { User } from "../schema/types";
import { DBStream } from "./stream-table";
import { WithID } from "./types";
import { DBWebhook, EventKey } from "./webhook-table";

namespace messages {
  interface TPayload {
    [key: string]: any;
  }

  export interface WebhookEvent {
    type: "webhook_event";
    id: string;
    event: EventKey;
    createdAt: number;
    userId: string;
    streamId: string;
    payload?: TPayload;
    retries?: number;
    lastInterval?: number;
    status?: string;
  }

  export interface WebhookTrigger {
    type: "webhook_trigger";
    id: string;
    user: WithID<User>;
    event: WebhookEvent;
    webhook: DBWebhook;
    stream: DBStream;
    retries?: number;
    lastInterval?: number;
  }
}

export default messages;
