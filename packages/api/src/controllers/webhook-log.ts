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
import { WebhookResponse } from "../schema/types";
import { DBWebhook } from "../store/webhook-table";
import { Request, Router } from "express";

const app = Router({ mergeParams: true });

const requestsFieldsMap: FieldsMap = {
  id: `webhook_response.ID`,
  createdAt: { val: `webhook_response.data->'createdAt'`, type: "int" },
  userId: `webhook_response.data->>'userId'`,
  event: `webhook_response.data->>'event'`,
  statusCode: `webhook_response.data->'response'->>'status'`,
};

app.post("/:requestId/resend", authorizer({}), async (req, res) => {
  const webhook = await db.webhook.get(req.params.id);
  const webhookResponse = await db.webhookResponse.get(req.params.requestId);
  await checkRequest(req, webhook, webhookResponse);

  const resent = await resendWebhook(webhook, webhookResponse);
  res.status(200);
  return res.json(db.webhookResponse.cleanWriteOnlyResponse(resent));
});

app.get("/:requestId", authorizer({}), async (req, res) => {
  const webhook = await db.webhook.get(req.params.id);
  const webhookResponse = await db.webhookResponse.get(req.params.requestId);
  await checkRequest(req, webhook, webhookResponse);

  res.status(200);
  return res.json(db.webhookResponse.cleanWriteOnlyResponse(webhookResponse));
});

async function checkRequest(
  req: Request,
  webhook: DBWebhook,
  webhookResponse: WebhookResponse
) {
  if (!webhook || webhook.deleted) {
    throw new NotFoundError(`webhook not found`);
  }
  if (!webhookResponse || webhookResponse.deleted) {
    throw new NotFoundError(`webhook log not found`);
  }
  if (
    !req.user.admin &&
    (req.user.id !== webhook.userId || req.user.id !== webhookResponse.userId)
  ) {
    throw new ForbiddenError(`invalid user`);
  }
  if (webhookResponse.webhookId !== webhook.id) {
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
    query.push(sql`webhook_response.data->>'webhookId' = ${req.params.id}`);
    if (!all || all === "false") {
      query.push(sql`webhook_response.data->>'deleted' IS NULL`);
    }

    let fields =
      " webhook_response.id as id, webhook_response.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `webhook_response left join users on webhook_response.data->>'userId' = users.id`;
    const [output, newCursor] = await db.webhookResponse.find(query, {
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
  query.push(sql`webhook_response.data->>'userId' = ${req.user.id}`);
  query.push(sql`webhook_response.data->>'webhookId' = ${req.params.id}`);

  if (!all || all === "false" || !req.user.admin) {
    query.push(sql`webhook_response.data->>'deleted' IS NULL`);
  }

  let fields = " webhook_response.id as id, webhook_response.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `webhook_response`;
  const [output, newCursor] = await db.webhookResponse.find(query, {
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

  return res.json(db.webhookResponse.cleanWriteOnlyResponses(output));
});

export default app;
