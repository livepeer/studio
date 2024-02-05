import {
  FieldsMap,
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import { authorizer } from "../middleware";
import { db } from "../store";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../store/errors";
import { resendWebhook } from "../webhooks/cannon";
import sql from "sql-template-strings";
import { WebhookLog } from "../schema/types";
import { DBWebhook } from "../store/webhook-table";
import { Request, Router } from "express";

const app = Router({ mergeParams: true });

const requestsFieldsMap: FieldsMap = {
  id: `webhook_log.ID`,
  createdAt: { val: `webhook_log.data->'createdAt'`, type: "int" },
  userId: `webhook_log.data->>'userId'`,
  event: `webhook_log.data->>'event'`,
  statusCode: `webhook_log.data->'response'->>'status'`,
  resourceId: {
    val: `webhook_log.data->'request'->>'body'`,
    type: "full-text",
  },
};

app.post("/:requestId/resend", authorizer({}), async (req, res) => {
  const webhook = await db.webhook.get(req.params.id);
  const webhookLog = await db.webhookLog.get(req.params.requestId);
  await checkRequest(req, webhook, webhookLog);

  const resent = await resendWebhook(webhook, webhookLog);
  res.status(200);
  return res.json(db.webhookLog.cleanWriteOnlyResponse(resent));
});

app.get("/:requestId", authorizer({}), async (req, res) => {
  const webhook = await db.webhook.get(req.params.id);
  const webhookLog = await db.webhookLog.get(req.params.requestId);
  await checkRequest(req, webhook, webhookLog);

  res.status(200);
  return res.json(db.webhookLog.cleanWriteOnlyResponse(webhookLog));
});

async function checkRequest(
  req: Request,
  webhook: DBWebhook,
  webhookLog: WebhookLog
) {
  if (!webhook || webhook.deleted) {
    throw new NotFoundError(`webhook not found`);
  }
  if (!webhookLog || webhookLog.deleted) {
    throw new NotFoundError(`webhook log not found`);
  }
  if (
    !req.user.admin &&
    (req.user.id !== webhook.userId || req.user.id !== webhookLog.userId)
  ) {
    throw new ForbiddenError(`invalid user`);
  }
  if (webhookLog.webhookId !== webhook.id) {
    throw new BadRequestError(`mismatch between webhook and webhook log`);
  }
}

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, all, allUsers, order, filters, count } = toStringValues(
    req.query
  );
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "createdAt-true";
  }

  if (req.user.admin && allUsers && allUsers !== "false") {
    const query = parseFilters(requestsFieldsMap, filters);
    query.push(sql`webhook_log.data->>'webhookId' = ${req.params.id}`);
    if (!all || all === "false") {
      query.push(sql`webhook_log.data->>'deleted' IS NULL`);
    }

    let fields =
      " webhook_log.id as id, webhook_log.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `webhook_log left join users on webhook_log.data->>'userId' = users.id`;
    const [output, newCursor] = await db.webhookLog.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(requestsFieldsMap, order),
      process: ({ data, usersdata, count: c }) => {
        if (count) {
          res.set("X-Total-Count", c);
        }
        return { ...data, user: db.user.cleanWriteOnlyResponse(usersdata) };
      },
    });

    res.status(200);

    if (output.length > 0 && newCursor) {
      res.links({ next: makeNextHREF(req, newCursor) });
    }
    return res.json(output);
  }

  const query = parseFilters(requestsFieldsMap, filters);
  query.push(sql`webhook_log.data->>'userId' = ${req.user.id}`);
  query.push(sql`webhook_log.data->>'webhookId' = ${req.params.id}`);

  if (!all || all === "false" || !req.user.admin) {
    query.push(sql`webhook_log.data->>'deleted' IS NULL`);
  }

  let fields = " webhook_log.id as id, webhook_log.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `webhook_log`;
  const [output, newCursor] = await db.webhookLog.find(query, {
    limit,
    cursor,
    fields,
    from,
    order: parseOrder(requestsFieldsMap, order),
    process: ({ data, count: c }) => {
      if (count) {
        res.set("X-Total-Count", c);
      }
      return { ...data };
    },
  });

  res.status(200);

  if (output.length > 0) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(db.webhookLog.cleanWriteOnlyResponses(output));
});

export default app;
