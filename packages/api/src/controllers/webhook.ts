import { URL } from "url";
import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import logger from "../logger";
import { v4 as uuid } from "uuid";
import { makeNextHREF, parseFilters, parseOrder, FieldsMap } from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { UnprocessableEntityError, NotFoundError } from "../store/errors";
import { WebhookStatusPayload } from "../schema/types";
import { DBWebhook } from "../store/webhook-table";

function validateWebhookPayload(id, userId, createdAt, payload) {
  try {
    new URL(payload.url);
  } catch (e) {
    console.error(`couldn't parse the provided url: ${payload.url}`);
    throw new UnprocessableEntityError(`bad url: ${payload.url}`);
  }

  if (!payload.events && !payload.event) {
    throw new UnprocessableEntityError(
      `must provide "events" field with subscriptions`
    );
  }

  return {
    id,
    userId,
    createdAt,
    kind: "webhook",
    name: payload.name,
    events: payload.events ?? [payload.event],
    url: payload.url,
    sharedSecret: payload.sharedSecret,
    streamId: payload.streamId,
  };
}

const app = Router();

const fieldsMap: FieldsMap = {
  id: `webhook.ID`,
  name: { val: `webhook.data->>'name'`, type: "full-text" },
  url: `webhook.data->>'url'`,
  blocking: `webhook.data->'blocking'`,
  deleted: `webhook.data->'deleted'`,
  createdAt: `webhook.data->'createdAt'`,
  userId: `webhook.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  sharedSecret: `webhook.data->>'sharedSecret'`,
};

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, all, event, allUsers, order, filters, count } =
    req.query;
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  if (req.user.admin && allUsers && allUsers !== "false") {
    const query = parseFilters(fieldsMap, filters);
    if (!all || all === "false") {
      query.push(sql`webhook.data->>'deleted' IS NULL`);
    }

    let fields =
      " webhook.id as id, webhook.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `webhook left join users on webhook.data->>'userId' = users.id`;
    const [output, newCursor] = await db.webhook.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(fieldsMap, order),
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

  const query = parseFilters(fieldsMap, filters);
  query.push(sql`webhook.data->>'userId' = ${req.user.id}`);

  if (!all || all === "false") {
    query.push(sql`webhook.data->>'deleted' IS NULL`);
  }

  let fields = " webhook.id as id, webhook.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `webhook`;
  const [output, newCursor] = await db.webhook.find(query, {
    limit,
    cursor,
    fields,
    from,
    order: parseOrder(fieldsMap, order),
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

  return res.json(output);
});

app.get("/subscribed/:event", authorizer({}), async (req, res) => {
  let event = req.params.event;

  let userId =
    req.user.admin && req.query.userId ? req.query.userId : req.user.id;

  let streamId = req.query.streamId;

  const { data } = await db.webhook.listSubscribed(userId, event, streamId);

  res.status(200);
  return res.json(data);
});

app.post("/", authorizer({}), validatePost("webhook"), async (req, res) => {
  const id = uuid();
  const doc = validateWebhookPayload(id, req.user.id, Date.now(), req.body);
  try {
    await req.store.create(doc);
  } catch (e) {
    console.error(e);
    throw e;
  }
  res.status(201);
  res.json(doc);
});

app.get("/:id", authorizer({}), async (req, res) => {
  // get a specific webhook
  logger.info(`webhook params ${req.params.id}`);

  const webhook = await db.webhook.get(req.params.id);
  if (
    !webhook ||
    ((webhook.deleted || webhook.userId !== req.user.id) && !req.user.admin)
  ) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  res.status(200);
  res.json(webhook);
});

app.put("/:id", authorizer({}), validatePost("webhook"), async (req, res) => {
  // modify a specific webhook
  const webhook = await req.store.get(`webhook/${req.body.id}`);
  if ((webhook.userId !== req.user.id || webhook.deleted) && !req.user.admin) {
    // do not reveal that webhooks exists
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  const { id, userId, createdAt } = webhook;
  const doc = validateWebhookPayload(id, userId, createdAt, req.body);
  try {
    await req.store.replace(doc);
  } catch (e) {
    console.error(e);
    throw e;
  }
  res.status(200);
  res.json({ id: req.body.id });
});

app.patch(
  "/:id",
  authorizer({}),
  validatePost("webhook-patch-payload"),
  async (req, res) => {
    const webhook = await db.webhook.get(req.params.id);

    if (!webhook) {
      throw new NotFoundError(`webhook not found`);
    }

    if (
      (webhook.userId !== req.user.id || webhook.deleted) &&
      !req.user.admin
    ) {
      // do not reveal that webhooks exists
      throw new NotFoundError(`webhook not found`);
    }

    const { id, userId, createdAt, kind } = webhook;

    if (req.body.streamId) {
      const stream = await db.stream.get(req.body.streamId);
      if (!stream || stream.deleted || stream.userId !== webhook.userId) {
        throw new NotFoundError(`stream not found`);
      }
    }

    const { name, events, url, sharedSecret, streamId } = req.body;
    await db.webhook.update(req.params.id, {
      name,
      events,
      url,
      sharedSecret,
      streamId,
    });

    res.status(204).end();
  }
);

app.post(
  "/:id/status",
  authorizer({ anyAdmin: true }),
  validatePost("webhook-status-payload"),
  async (req, res) => {
    const { id } = req.params;
    const webhook = await db.webhook.get(id);
    if (!webhook || webhook.deleted) {
      return res.status(404).json({ errors: ["webhook not found or deleted"] });
    }

    const { response, errorMessage } = req.body as WebhookStatusPayload;

    if (!response || !response.response) {
      return res.status(422).json({ errors: ["missing response in payload"] });
    }
    if (!response.response.body && response.response.body !== "") {
      return res
        .status(400)
        .json({ errors: ["missing body in payload response"] });
    }

    try {
      const triggerTime = response.createdAt ?? Date.now();
      let status: DBWebhook["status"] = { lastTriggeredAt: triggerTime };
      if (
        response.statusCode >= 300 ||
        !response.statusCode ||
        response.statusCode === 0
      ) {
        status = {
          ...status,
          lastFailure: {
            error: errorMessage,
            timestamp: triggerTime,
            statusCode: response.statusCode,
            response: response.response.body,
          },
        };
      }
      await db.webhook.updateStatus(webhook.id, status);
    } catch (e) {
      console.log(
        `Unable to store status of webhook ${webhook.id} url: ${webhook.url}`
      );
    }

    // TODO : Change the response type and save the response making sure it's compatible object
    /*await db.webhookResponse.create({
      id: uuid(),
      webhookId: webhook.id,
      createdAt: Date.now(),
      statusCode: response.statusCode,
      response: {
        body: response.response.body,
        status: response.statusCode,
      },
    });*/

    res.status(204).end();
  }
);

app.delete("/:id", authorizer({}), async (req, res) => {
  // delete a specific webhook
  const webhook = await db.webhook.get(req.params.id);
  if (
    !webhook ||
    ((webhook.deleted || webhook.userId !== req.user.id) && !req.isUIAdmin)
  ) {
    // do not reveal that webhooks exists
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  try {
    await db.webhook.markDeleted(webhook.id);
  } catch (e) {
    console.error(e);
    throw e;
  }
  res.status(204);
  res.end();
});

app.delete("/", authorizer({}), async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    res.status(422);
    return res.json({
      errors: ["missing ids"],
    });
  }

  if (!req.user.admin) {
    const webhooks = await db.webhook.getMany(ids);
    if (
      webhooks.length !== ids.length ||
      webhooks.some((s) => s.deleted || s.userId !== req.user.id)
    ) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }
  }
  await db.webhook.markDeletedMany(ids);

  res.status(204);
  res.end();
});

export default app;
