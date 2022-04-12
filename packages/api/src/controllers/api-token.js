import Router from "express/lib/router";
import uuid from "uuid/v4";
import sql from "sql-template-strings";

import { makeNextHREF, parseOrder, parseFilters } from "./helpers";
import { authorizer, validatePost } from "../middleware";
import { AuthPolicy } from "../middleware/authPolicy";
import { db } from "../store";

const app = Router();

app.use(authorizer({ noApiToken: true }));

app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const apiToken = await req.store.get(`api-token/${id}`);
  if (!apiToken) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== apiToken.userId) {
    // This would only come up if someone was brute-forcing; let's give them a 404
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  res.status(200);
  res.json(apiToken);
});

app.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const apiToken = await req.store.get(`api-token/${id}`);
  if (!apiToken) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== apiToken.userId) {
    res.status(403);
    return res.json({ errors: ["users may only delete their own API tokens"] });
  }
  await req.store.delete(`api-token/${id}`);
  res.status(204);
  res.end();
});

const fieldsMap = {
  id: `api_token.ID`,
  name: { val: `api_token.data->>'name'`, type: "full-text" },
  lastSeen: `api_token.data->'lastSeen'`,
  userId: `api_token.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
};

app.get("/", async (req, res) => {
  let { userId, cursor, limit, order, filters, count } = req.query;
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }

  if (!userId && !req.user.admin) {
    res.status(400);
    return res.json({
      errors: ["missing query parameter: userId"],
    });
  }

  if (!userId) {
    const query = parseFilters(fieldsMap, filters);

    let fields =
      " api_token.id as id, api_token.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `api_token left join users on api_token.data->>'userId' = users.id`;
    const [output, newCursor] = await db.apiToken.find(query, {
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
    res.json(output);
    return;
  }

  if (req.user.admin !== true && req.user.id !== userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own tokens"],
    });
  }

  const query = parseFilters(fieldsMap, filters);
  query.push(sql`api_token.data->>'userId' = ${userId}`);

  let fields = " api_token.id as id, api_token.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `api_token`;
  const [output, newCursor] = await db.apiToken.find(query, {
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

  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(output);
});

app.post("/", validatePost("api-token"), async (req, res) => {
  const id = uuid();
  const userId =
    req.body.userId && req.user.admin ? req.body.userId : req.user.id;

  if (req.body.access?.cors && req.user.admin) {
    res.status(403);
    return res.json({
      errors: ["cors api keys are not available to admins"],
    });
  }
  if (req.body.access?.rules) {
    try {
      new AuthPolicy(req.body.access.rules);
    } catch (err) {
      res.status(422);
      return res.json({ errors: [`Bad access rules: ${err}`] });
    }
  }
  await req.store.create({
    id: id,
    userId: userId,
    kind: "api-token",
    name: req.body.name,
    access: req.body.access,
    createdAt: Date.now(),
  });
  const apiToken = await req.store.get(`api-token/${id}`);

  if (apiToken) {
    res.status(201);
    res.json(apiToken);
  } else {
    res.status(403);
    res.json({});
  }
});

export default app;
