import sql from "sql-template-strings";
import { ApiToken } from "../schema/types";
import { db } from "../store";
import Table from "../store/table";
import { DBWebhook } from "../store/webhook-table";

const flushDelay = 60 * 1000; // 60s

type PendingLastSeen = {
  table: Table<{ id: string; lastSeen?: number }>;
  id: string;
  lastSeen: number;
};

class Tracker {
  pendingLastSeenUpdates: Map<string, PendingLastSeen> = new Map();

  recordUser(userId: string) {
    this.recordLastSeen(db.user, userId);
  }

  recordToken({ id }: ApiToken) {
    this.recordLastSeen(db.apiToken, id);
  }

  recordSigningKeyValidation(signingKeyId: string) {
    this.recordLastSeen(db.signingKey, signingKeyId);
  }

  private recordLastSeen(
    table: Table<{ id: string; lastSeen?: number }>,
    id: string,
  ) {
    const key = `${table.name}-${id}`;
    const alreadyScheduled = this.pendingLastSeenUpdates.has(key);
    this.pendingLastSeenUpdates.set(key, { table, id, lastSeen: Date.now() });
    if (alreadyScheduled) return;

    setTimeout(() => this.flushLastSeen(key), flushDelay);
  }

  private async flushLastSeen(key: string) {
    const { table, id, lastSeen } = this.pendingLastSeenUpdates.get(key) ?? {};
    this.pendingLastSeenUpdates.delete(key);
    if (!id) {
      return;
    }
    try {
      await table.update(
        [
          sql`id = ${id}`,
          sql`coalesce((data->'lastSeen')::bigint, 0) < ${lastSeen}`,
        ],
        { lastSeen },
      );
    } catch (err) {
      console.log(
        `error saving last seen: table=${table?.name} id=${id} err=`,
        err,
      );
    }
  }

  pendingWebhookStatusUpdates: Map<string, DBWebhook["status"]> = new Map();

  recordWebhookStatus(id: string, status: DBWebhook["status"]) {
    const key = `${id}`;
    const alreadyScheduled = this.pendingWebhookStatusUpdates.has(key);
    this.pendingWebhookStatusUpdates.set(key, status);
    if (alreadyScheduled) return;

    setTimeout(() => this.flushWebhookStatus(key), flushDelay);
  }

  private async flushWebhookStatus(id: string) {
    const status = this.pendingWebhookStatusUpdates.get(id);
    this.pendingWebhookStatusUpdates.delete(id);
    if (!status) {
      return;
    }
    try {
      await db.webhook.updateStatus(id, status);
    } catch (err) {
      console.log(`error saving webhook status: id=${id} err=`, err);
    }
  }

  async flushAll() {
    for (const key of this.pendingLastSeenUpdates.keys()) {
      await this.flushLastSeen(key);
    }
    this.pendingLastSeenUpdates = new Map();

    for (const key of this.pendingWebhookStatusUpdates.keys()) {
      await this.flushWebhookStatus(key);
    }
    this.pendingWebhookStatusUpdates = new Map();
  }
}

const tracking = new Tracker();
export default tracking;
