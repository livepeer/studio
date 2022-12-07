import sql from "sql-template-strings";
import { Task } from "../schema/types";
import Table from "./table";
import { FindOptions, WithID } from "./types";

export default class TaskTable extends Table<WithID<Task>> {
  async listRunningTasks(
    userId: string,
    maxTaskUpdateAge: number,
    opts: FindOptions = { limit: 10 }
  ): Promise<WithID<Task>[]> {
    const activeTaskThreshold = Date.now() - maxTaskUpdateAge;
    const query = [
      sql`task.data->>'deleted' IS NULL`,
      sql`task.data->>'userId' = ${userId}`,
      sql`(
        task.data->'status'->>'phase' = 'running' OR
        (task.data->'status'->>'phase' = 'waiting' AND task.data->'status'->>'retries' IS NOT NULL)
      )`,
      // TODO: Clean-up these lost tasks, making them failed
      sql`coalesce((task.data->'status'->>'updatedAt')::bigint, 0) > ${activeTaskThreshold}`,
    ];
    let [tasks] = await this.find(query, opts);
    return tasks;
  }
}
