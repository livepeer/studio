import sql from "sql-template-strings";

import { Webhook } from "../schema/types";
import Table from "./table";
import { WithID } from "./types";

export type DBWebhook = WithID<
  Omit<Webhook, "event"> & { events: Webhook["events"] }
>;

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
      const jsonEv = JSON.stringify(event);
      query.push(sql`data->'events' @> ${jsonEv} OR data->>'event' = ${event}`);
    }
    if (!includeDeleted) {
      query.push(sql`data->>'deleted' IS NULL`);
    }
    const [webhooks, nextCursor] = await this.find(query, {
      limit,
      cursor,
    });
    return { data: webhooks.map(this.compatEventsField), cursor: nextCursor };
  }

  compatEventsField(maybeLegacy: WithID<Webhook>): DBWebhook {
    if (!maybeLegacy.event) {
      return maybeLegacy as DBWebhook;
    }
    const webhook: DBWebhook = { ...maybeLegacy, events: [maybeLegacy.event] };
    delete webhook["event"];
    return webhook;
  }
}
