import { EventKey } from "./webhook-table";

namespace messages {
  interface TPayload {
    [key: string]: any;
  }

  export interface WebhookEvent {
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
}

export default messages;
