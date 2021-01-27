import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import { trackAction, makeNextHREF, parseOrder, parseFilters } from "./helpers";
import logger from "../logger";
import uuid from "uuid/v4";
import { db } from "../store";

const app = Router();

async function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

app.get("/:id", authMiddleware({}), async (req, res) => {
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

app.delete("/:id", authMiddleware({}), async (req, res) => {
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
  name: `api_token.data->>'name'`,
  lastSeen: `api_token.data->'lastSeen'`,
  userId: `api_token.data->>'userId'`,
  "user.email": `users.data->>'email'`,
};

app.get("/", authMiddleware({}), async (req, res) => {
  let { userId, cursor, limit, order, filters } = req.query;
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

    const fields =
      " api_token.id as id, api_token.data as data, users.id as usersId, users.data as usersdata";
    const from = `api_token left join users on api_token.data->>'userId' = users.id`;
    const [output, newCursor] = await db.apiToken.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(fieldsMap, order),
      process: ({ data, usersdata }) => {
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

  const { data: userTokens } = await req.store.queryObjects({
    kind: "api-token",
    query: { userId: userId },
  });
  res.status(200);
  res.json(userTokens);
});

app.post(
  "/",
  authMiddleware({}),
  validatePost("api-token"),
  async (req, res) => {
    const id = uuid();
    const userId =
      req.body.userId && req.user.admin ? req.body.userId : req.user.id;

    await Promise.all([
      req.store.create({
        id: id,
        userId: userId,
        kind: "api-token",
        name: req.body.name,
        createdAt: Date.now(),
      }),
      trackAction(
        userId,
        req.user.email,
        { name: "Api Token Created" },
        req.config.segmentApiKey
      ),
    ]);

    const apiToken = await req.store.get(`api-token/${id}`);

    if (apiToken) {
      res.status(201);
      res.json(apiToken);
    } else {
      res.status(403);
      res.json({});
    }
  }
);

export default app;
