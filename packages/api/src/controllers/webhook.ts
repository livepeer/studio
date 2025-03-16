import { URL } from "url";
import { authorizer, hasAccessToResource } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import logger from "../logger";
import { v4 as uuid } from "uuid";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  FieldsMap,
  addDefaultProjectId,
  getProjectId,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { UnprocessableEntityError, NotFoundError } from "../store/errors";
import webhookLog from "./webhook-log";
import { jsonMiddleware } from "express-response-middleware";

function validateWebhookPayload(id, userId, projectId, createdAt, payload) {
  try {
    new URL(payload.url);
  } catch (e) {
    console.error(`couldn't parse the provided url: ${payload.url}`);
    throw new UnprocessableEntityError(`bad url: ${payload.url}`);
  }

  if (!payload.events && !payload.event) {
    throw new UnprocessableEntityError(
      `must provide "events" field with subscriptions`,
    );
  }

  return {
    id,
    userId,
    projectId,
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

app.use(jsonMiddleware(addDefaultProjectId));

app.use("/:id/log", webhookLog);

const fieldsMap: FieldsMap = {
  id: `webhook.ID`,
  name: { val: `webhook.data->>'name'`, type: "full-text" },
  url: `webhook.data->>'url'`,
  blocking: `webhook.data->'blocking'`,
  deleted: `webhook.data->'deleted'`,
  createdAt: { val: `webhook.data->'createdAt'`, type: "int" },
  userId: `webhook.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  projectId: `webhook.data->>'projectId'`,
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
  query.push(
    sql`coalesce(webhook.data->>'projectId', ${
      req.user.defaultProjectId || ""
    }) = ${req.project?.id || ""}`,
  );

  if (!all || all === "false" || !req.user.admin) {
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

  const { data } = await db.webhook.listSubscribed(
    userId,
    event,
    req.project?.id || req.user.defaultProjectId,
    req.user.defaultProjectId,
    streamId,
  );

  res.status(200);
  return res.json(data);
});

app.post("/", authorizer({}), validatePost("webhook"), async (req, res) => {
  const id = uuid();
  const doc = validateWebhookPayload(
    id,
    req.user.id,
    req.project?.id,
    Date.now(),
    req.body,
  );
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
  req.checkResourceAccess(webhook);

  res.status(200);
  res.json(webhook);
});

app.put("/:id", authorizer({}), validatePost("webhook"), async (req, res) => {
  // modify a specific webhook
  const webhook = await req.store.get(`webhook/${req.body.id}`);
  req.checkResourceAccess(webhook);

  const { id, userId, projectId, createdAt } = webhook;
  const doc = validateWebhookPayload(
    id,
    userId,
    projectId,
    createdAt,
    req.body,
  );
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

    req.checkResourceAccess(webhook);

    const { id, userId, projectId, createdAt, kind } = webhook;

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
  },
);

app.delete("/:id", authorizer({}), async (req, res) => {
  // delete a specific webhook
  const webhook = await db.webhook.get(req.params.id);
  req.checkResourceAccess(webhook, true);

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
      webhooks.some((s) => !hasAccessToResource(req, s))
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
