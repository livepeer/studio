import { URL } from "url";
import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import logger from "../logger";
import uuid from "uuid/v4";
import { makeNextHREF, trackAction, parseFilters, parseOrder } from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { ForbiddenError, UnprocessableEntityError } from "../store/errors";

async function validateWebhookPayload(id, userId, createdAt, payload) {
  if (payload.url && payload.email) {
    throw new UnprocessableEntityError(
      "webhook cannot have both url and email"
    );
  } else if (payload.url) {
    try {
      new URL(payload.url);
    } catch (e) {
      console.error(`couldn't parse the provided url: ${payload.url}`);
      throw new UnprocessableEntityError(`bad url: ${url}`);
    }
  } else if (payload.email) {
    const user = await db.user.get(userId);
    if (!user) {
      throw new Error(`invalid code path: no user found for id=${userId}`);
    }
    if (payload.email !== user.email) {
      throw new ForbiddenError(
        `email webhooks may only be created with your verfied email (${user.email})`
      );
    }
  } else {
    throw new UnprocessableEntityError(
      "webhook must have one of url and email"
    );
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
    email: payload.email,
    sharedSecret: payload.sharedSecret,
  };
}

const app = Router();

const fieldsMap = {
  id: `webhook.ID`,
  name: `webhook.data->>'name'`,
  url: `webhook.data->>'url'`,
  blocking: `webhook.data->'blocking'`,
  deleted: `webhook.data->'deleted'`,
  createdAt: `webhook.data->'createdAt'`,
  userId: `webhook.data->>'userId'`,
  "user.email": `users.data->>'email'`,
  sharedSecret: `webhook.data->>'sharedSecret'`,
};

app.get("/", authMiddleware({}), async (req, res) => {
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

app.post("/", authMiddleware({}), validatePost("webhook"), async (req, res) => {
  const id = uuid();
  const doc = await validateWebhookPayload(
    id,
    req.user.id,
    Date.now(),
    req.body
  );
  try {
    await req.store.create(doc);
    trackAction(
      req.user.id,
      req.user.email,
      { name: "Webhook Created" },
      req.config.segmentApiKey
    );
  } catch (e) {
    console.error(e);
    throw e;
  }
  res.status(201);
  res.json(doc);
});

app.get("/:id", authMiddleware({}), async (req, res) => {
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

app.put(
  "/:id",
  authMiddleware({}),
  validatePost("webhook"),
  async (req, res) => {
    // modify a specific webhook
    const webhook = await req.store.get(`webhook/${req.body.id}`);
    if (
      (webhook.userId !== req.user.id || webhook.deleted) &&
      !req.user.admin
    ) {
      // do not reveal that webhooks exists
      res.status(404);
      return res.json({ errors: ["not found"] });
    }

    const { id, userId, createdAt } = webhook;
    const doc = await validateWebhookPayload(id, userId, createdAt, req.body);
    try {
      await req.store.replace(doc);
    } catch (e) {
      console.error(e);
      throw e;
    }
    res.status(200);
    res.json({ id: req.body.id });
  }
);

app.delete("/:id", authMiddleware({}), async (req, res) => {
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

app.delete("/", authMiddleware({}), async (req, res) => {
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
