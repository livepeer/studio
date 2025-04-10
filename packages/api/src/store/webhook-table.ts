import sql from "sql-template-strings";

import { Webhook } from "../schema/types";
import { NotFoundError } from "./errors";
import Table from "./table";

export type EventKey = Webhook["events"][0];

export type DBWebhook = Omit<Webhook, "event"> & {
  id: string;
  events: EventKey[];
  /**
  @deprecated: This is to make DBWebhook type unassignable to Webhook and avoid
  programming mistakes. Always use DBWebhook unless in the API controller where
  the conversion of field .event to .events will take place.
  **/
  event?: "deprecated";
};

export default class WebhookTable extends Table<DBWebhook> {
  async listSubscribed(
    userId: string,
    event: EventKey,
    projectId: string,
    defaultProjectId: string,
    streamId?: string,
    limit = null,
    cursor?: string,
    includeDeleted = false,
  ) {
    const query = [sql`data->>'userId' = ${userId}`];
    if (streamId) {
      query.push(
        sql`(data->>'streamId' = ${streamId} OR data->>'streamId' IS NULL)`,
      );
    }

    query.push(
      sql`coalesce(data->>'projectId', ${
        defaultProjectId || ""
      }) = ${projectId || defaultProjectId}`,
    );

    if (event) {
      const jsonEvent = JSON.stringify(event);
      query.push(sql`data->'events' @> ${jsonEvent}`);
    }

    if (!includeDeleted) {
      query.push(sql`data->>'deleted' IS NULL`);
    }

    const [webhooks, nextCursor] = await this.find(query, {
      limit,
      cursor,
    });
    return { data: webhooks, cursor: nextCursor };
  }

  async updateStatus(id: string, status: DBWebhook["status"]) {
    const statusStr = JSON.stringify(status);
    const res = await this.db.query(
      sql``
        .append(`UPDATE ${this.name} `) // table name can't be parameterized, append a raw string
        .append(
          sql`SET data = jsonb_set(data, '{status}', case when data->'status' is null then '{}' else data->'status' end || ${statusStr}) `,
        )
        .append(sql`WHERE id = ${id}`),
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} id=${id}`);
    }
  }
}
