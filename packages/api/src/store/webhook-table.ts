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
    limit = 100,
    cursor?: string,
    includeDeleted = false
  ) {
    const query = [sql`data->>'userId' = ${userId}`];
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
    const res = await this.db.query(
      `UPDATE ${
        this.name
      } SET data = jsonb_set(data, '{status}', case when data->'status' is null then '{}' else data->'status' end || '${JSON.stringify(
        status.status
      )}') WHERE id = '${id}'`
    );

    if (res.rowCount < 1) {
      throw new NotFoundError(`couldn't find ${this.name} id=${id}`);
    }
  }
}
