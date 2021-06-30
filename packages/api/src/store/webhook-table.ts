import sql from "sql-template-strings";

import { Webhook } from "../schema/types";
import Table from "./table";
import { WithID } from "./types";

export default class WebhookTable extends Table<WithID<Webhook>> {
  async listSubscribed(
    userId: string,
    event: string,
    limit = 100,
    cursor?: string,
    includeDeleted = false
  ) {
    const query = [sql`data->>'userId' = ${userId}`];
    if (event) {
      query.push(sql`data->>'event' = ${event}`);
    }
    if (!includeDeleted) {
      query.push(sql`data->>'deleted' IS NULL`);
    }
    const [webhooks, nextCursor] = await this.db.webhook.find(query, {
      limit,
      cursor,
    });
    return { data: webhooks, cursor: nextCursor };
  }
}
