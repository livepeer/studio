import sql from "sql-template-strings";

import { Webhook } from "../schema/types";
import Table from "./table";
import { WithID } from "./types";

export type DBWebhook = Omit<Webhook, "event"> & {
  id: string;
  events: Webhook["events"];
};

export default class WebhookTable extends Table<DBWebhook> {
  async listSubscribed(
    userId: string,
    event: string,
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
}
