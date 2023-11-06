import sql from "sql-template-strings";

import { Experiment } from "../schema/types";
import db from "./db";
import { ForbiddenError, NotFoundError } from "./errors";
import Table from "./table";
import { WithID } from "./types";

export async function isExperimentSubject(experiment: string, userId?: string) {
  try {
    const { audienceUserIds, audienceAllowAll } =
      await db.experiment.getByNameOrId(experiment);
    return audienceAllowAll || (audienceUserIds?.includes(userId) ?? false);
  } catch (err) {
    return false;
  }
}

export async function ensureExperimentSubject(
  experiment: string,
  userId: string
) {
  if (!(await isExperimentSubject(experiment, userId))) {
    throw new ForbiddenError(
      `user is not a subject of experiment: ${experiment}`
    );
  }
}

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
}
