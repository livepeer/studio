import sql from "sql-template-strings";
import { ApiToken } from "../schema/types";
import { db } from "../store";
import Table from "../store/table";

const flushDelay = 60 * 1000; // 60s

class Tracker {
  updateLastSeenTasks: Map<string, number> = new Map();

  recordUser(userId: string) {
    this.recordLastSeen(db.user, userId);
  }

  recordToken({ id }: ApiToken) {
    this.recordLastSeen(db.apiToken, id);
  }

  private recordLastSeen(
    table: Table<{ id: string; lastSeen?: number }>,
    id: string
  ) {
    const alreadyScheduled = this.updateLastSeenTasks.has(id);
    this.updateLastSeenTasks.set(id, Date.now());
    if (alreadyScheduled) return;

    setTimeout(async () => {
      try {
        const lastSeen = this.updateLastSeenTasks.get(id);
        this.updateLastSeenTasks.delete(id);

        await table.update(
          [
            sql`id = ${id}`,
            sql`coalesce((data->'lastSeen'})::bigint, 0) < ${lastSeen}`,
          ],
          { lastSeen } as any
        );
      } catch (err) {
        console.log(
          `error saving last seen: table=${table.name} id=${id} err=`,
          err
        );
      }
    }, flushDelay);
  }
}

const tracking = new Tracker();
export default tracking;
