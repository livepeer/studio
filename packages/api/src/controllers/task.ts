import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import uuid from "uuid/v4";
import { FieldsMap, makeNextHREF, parseFilters, parseOrder } from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";

const app = Router();

function validateTaskPayload(
  id: string,
  userId: string,
  createdAt: number,
  payload
) {
  return {
    id,
    userId,
    createdAt,
    name: payload.name,
    type: payload.type,
  };
}

const fieldsMap: FieldsMap = {
  id: `task.ID`,
  name: { val: `task.data->>'name'`, type: "full-text" },
  createdAt: `task.data->'createdAt'`,
  userId: `task.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  type: `task.data->>'type'`,
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
      query.push(sql`task.data->>'deleted' IS NULL`);
    }

    let fields =
      " task.id as id, task.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `task left join users on task.data->>'userId' = users.id`;
    const [output, newCursor] = await db.task.find(query, {
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
  query.push(sql`task.data->>'userId' = ${req.user.id}`);

  if (!all || all === "false") {
    query.push(sql`task.data->>'deleted' IS NULL`);
  }

  let fields = " task.id as id, task.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `task`;
  const [output, newCursor] = await db.task.find(query, {
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

app.get("/:id", authMiddleware({}), async (req, res) => {
  const task = await db.task.get(req.params.id);
  console.log(task);
  if (!task) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }

  if (req.user.admin !== true && req.user.id !== task.userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own tasks"],
    });
  }

  res.json(task);
});

app.post("/", authMiddleware({}), validatePost("task"), async (req, res) => {
  const id = uuid();
  const doc = validateTaskPayload(id, req.user.id, Date.now(), req.body);

  await db.task.create(doc);

  res.status(201);
  res.json(doc);
});

app.post(
  "/status/:id",
  authMiddleware({}),
  validatePost("task"),
  async (req, res) => {
    // update status of a specific task
    const { id } = req.params;
    const task = await db.task.get(id);
    if (!req.user.admin) {
      res.status(403);
      return res.json({ errors: ["Forbidden"] });
    }

    let status = req.body.status;
    status.updatedAt = Date.now();
    let doc = {
      id: id,
      status: status,
    };

    await db.task.update(id, doc);

    res.status(200);
    res.json({ id: id });
  }
);

app.delete("/:id", authMiddleware({}), async (req, res) => {
  const { id } = req.params;
  const task = await db.task.get(id);
  if (!task) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== task.userId) {
    res.status(403);
    return res.json({
      errors: ["users may only delete their own tasks"],
    });
  }
  await db.task.delete(id);
  res.status(204);
  res.end();
});

app.patch(
  "/:id",
  authMiddleware({}),
  validatePost("task"),
  async (req, res) => {
    // update a specific task
    const task = await db.task.get(req.body.id);
    if (!req.user.admin) {
      res.status(403);
      return res.json({ errors: ["Forbidden"] });
    }

    const doc = req.body;
    await db.task.update(req.body.id, doc);

    res.status(200);
    res.json({ id: req.body.id });
  }
);

export default app;
