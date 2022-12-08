import sql, { SQLStatement } from "sql-template-strings";
import logger from "../logger";
import { Task } from "../schema/types";
import Table from "./table";
import { WithID } from "./types";

// TODO: Clean-up these lost tasks, making them failed
const ACTIVE_TASK_TIMEOUT = 5 * 60 * 1000; // 5 mins
const ENQUEUED_TASK_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours

function joinOr(filters: SQLStatement[]): SQLStatement {
  const stmt = sql`(`;
  filters.forEach((filter, idx) => {
    if (idx > 0) {
      stmt.append(" OR ");
    }
    stmt.append(`(`).append(filter).append(`)`);
  });
  return stmt.append(`)`);
}

export default class TaskTable extends Table<WithID<Task>> {
  async countRunningTasks(userId: string) {
    return this.countPendingTasks(userId, true);
  }

  async countScheduledTasks(userId: string) {
    return this.countPendingTasks(userId, false);
  }

  private async countPendingTasks(
    userId: string,
    startedTasksOnly: boolean
  ): Promise<number> {
    const activeTaskThreshold = Date.now() - ACTIVE_TASK_TIMEOUT;
    // tasks that are on a retry backoff will be in the `waiting` phase with a `retries` field
    const phaseConds = [
      sql`
      (
        task.data->'status'->>'phase' = 'running'
        OR (task.data->'status'->>'phase' = 'waiting' AND task.data->'status'->>'retries' IS NOT NULL)
      )
      AND coalesce( (task.data->'status'->>'updatedAt')::bigint, 0) > ${activeTaskThreshold}`,
    ];

    if (!startedTasksOnly) {
      const enqueuedTaskThreshold = Date.now() - ENQUEUED_TASK_TIMEOUT;
      phaseConds.push(
        sql`
          task.data->'status'->>'phase' = 'waiting'
          AND task.data->'status'->>'retries' IS NULL
          AND coalesce( (task.data->'status'->>'updatedAt')::bigint, 0) > ${enqueuedTaskThreshold}`
      );
    }

    const query = [
      sql`task.data->>'deleted' IS NULL`,
      sql`task.data->>'userId' = ${userId}`,
      joinOr(phaseConds),
    ];
    let [count] = await this.find(query, {
      fields: "COUNT(*) as count",
      order: "",
      process: (row: { count: number }) => row.count,
    });
    return count[0] ?? 0;
  }

  async ensureTable(): Promise<void> {
    await super.ensureTable();

    const indexName = [this.name, "pendingTasks"].join("_");
    try {
      await this.db.query(`
          CREATE INDEX "${indexName}" ON "${this.name}"
          USING BTREE (
            (data->>'userId'),
            coalesce((task.data->'status'->>'updatedAt')::bigint, 0),
            (data->'status'->>'phase')
          );
        `);
    } catch (e) {
      if (!e.message.includes("already exists")) {
        throw e;
      }
      return;
    }
    logger.info(`Created index ${indexName} on ${this.name}`);
  }
}
