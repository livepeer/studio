import sql from "sql-template-strings";
import { ApiToken } from "../schema/types";
import { db } from "../store";
import Table from "../store/table";

const flushDelay = 60 * 1000; // 60s

type PendingLastSeen = {
  table: Table<{ id: string; lastSeen?: number }>;
  id: string;
  lastSeen: number;
};

class Tracker {
  pendingUpdates: Map<string, PendingLastSeen> = new Map();

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
    id: string
  ) {
    const key = `${table.name}-${id}`;
    const alreadyScheduled = this.pendingUpdates.has(key);
    this.pendingUpdates.set(key, { table, id, lastSeen: Date.now() });
    if (alreadyScheduled) return;

    setTimeout(() => this.flushLastSeen(key), flushDelay);
  }

  private async flushLastSeen(key: string) {
    const { table, id, lastSeen } = this.pendingUpdates.get(key) ?? {};
    this.pendingUpdates.delete(key);
    if (!id) {
      return;
    }
    try {
      await table.update(
        [
          sql`id = ${id}`,
          sql`coalesce((data->'lastSeen')::bigint, 0) < ${lastSeen}`,
        ],
        { lastSeen }
      );
    } catch (err) {
      console.log(`error saving last seen: table=${table?.name} id=${id}`);
    }
  }

  async flushAll() {
    const all = this.pendingUpdates;
    this.pendingUpdates = new Map();

    for (const key of all.keys()) {
      await this.flushLastSeen(key);
    }
  }
}

const tracking = new Tracker();
export default tracking;
