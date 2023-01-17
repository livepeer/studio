import sql from "sql-template-strings";

import { Experiment } from "../schema/types";
import { NotFoundError } from "./errors";
import Table from "./table";
import { WithID } from "./types";

export default class ExperimentTable extends Table<WithID<Experiment>> {
  async listUserExperiments(
    userId: string,
    limit = 1000,
    cursor?: string,
    includeDeleted = false
  ) {
    const query = [sql`data->'audienceUserIds' @> ${userId}`];
    if (!includeDeleted) {
      query.push(sql`data->>'deleted' IS NULL`);
    }

    const [experiments, nextCursor] = await this.find(query, {
      limit,
      cursor,
    });
    return { data: experiments, cursor: nextCursor };
  }

  async getByNameOrId(nameOrId: string) {
    const [experiments] = await this.find(
      [sql`(data->>'name' = ${nameOrId} OR id = ${nameOrId})`],
      { limit: 1 }
    );
    if (!experiments?.length) {
      throw new NotFoundError("experiment not found");
    }
    return experiments[0];
  }

  async isExperimentSubject(nameOrId: string, userId: string) {
    const { audienceUserIds } = await this.getByNameOrId(nameOrId);
    return audienceUserIds.includes(userId);
  }
}
