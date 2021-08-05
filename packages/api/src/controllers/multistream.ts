import { SQLStatement } from "sql-template-strings";
import mung from "express-mung";

import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Response, Router } from "express";
import { makeNextHREF, parseFilters, parseOrder } from "./helpers";
import { db } from "../store";
import { FindOptions, FindQuery } from "../store/types";
import { MultistreamTarget } from "../schema/types";
import { DBMultistreamTarget } from "../store/push-target-table";

const fieldsMap = {
  id: `multistream_target.ID`,
  name: `multistream_target.data->>'name'`,
  url: `multistream_target.data->>'url'`,
  disabled: { val: `multistream_target.data->'disabled'`, type: "boolean" },
  createdAt: { val: `multistream_target.data->'createdAt'`, type: "int" },
  userId: `multistream_target.data->>'userId'`,
  "user.email": `users.data->>'email'`,
};

function adminListQuery(
  limit: number,
  cursor: string,
  orderStr: string,
  filters: string
): [SQLStatement[], FindOptions] {
  const fields =
    " multistream_target.id as id, multistream_target.data as data, users.id as usersId, users.data as usersData";
  const from = `multistream_target left join users on multistream_target.data->>'userId' = users.id`;
  const order = parseOrder(fieldsMap, orderStr);
  const process = ({ data, usersData }) => {
    return { ...data, user: db.user.cleanWriteOnlyResponse(usersData) };
  };

  const query = parseFilters(fieldsMap, filters);
  const opts = { limit, cursor, fields, from, order, process };
  return [query, opts];
}

function toStringValues(obj: Record<string, any>): Record<string, string> {
  const strObj = {};
  for (const [key, value] of Object.entries(obj)) {
    strObj[key] = value.toString();
  }
  return strObj;
}

function respondError(res: Response, status: number, error: string) {
  return res.status(status).json({
    errors: [error],
  });
}

const notFound = (res: Response) => respondError(res, 404, "not found");

const forbidden = (res: Response) =>
  respondError(res, 403, "users can only access their own multistream targets");

const badRequest = (res: Response, error: string) =>
  respondError(res, 400, error);

const target = Router();

target.use(authMiddleware({}));

target.use(
  mung.json(function cleanWriteOnlyResponses(data, req) {
    if (req.user.admin) {
      return data;
    }
    if (Array.isArray(data)) {
      return db.multistreamTarget.cleanWriteOnlyResponses(data);
    }
    if ("id" in data) {
      return db.multistreamTarget.cleanWriteOnlyResponse(
        data as DBMultistreamTarget
      );
    }
    return data;
  })
);

target.get("/", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const qs = toStringValues(req.query);
  const { limit: limitStr, cursor, userId, order, filters } = qs;
  let limit = parseInt(limitStr);
  if (isNaN(limit)) {
    limit = undefined;
  }

  let query: FindQuery | Array<SQLStatement>;
  let opts: FindOptions;
  if (!userId) {
    if (!isAdmin) {
      return badRequest(res, "required query parameter: userId");
    }
    [query, opts] = adminListQuery(limit, cursor, order, filters);
  } else {
    if (!isAdmin && req.user.id !== userId) {
      return forbidden(res);
    }
    [query, opts] = [{ userId }, { limit, cursor }];
  }
  const [output, newCursor] = await db.multistreamTarget.find(query, opts);

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(output);
});

target.get("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const data = await db.multistreamTarget.getAuthed(
    req.params.id,
    req.user.id,
    isAdmin
  );
  if (!data) {
    return notFound(res);
  }
  res.json(data);
});

target.post("/", validatePost("multistream-target"), async (req, res) => {
  const input = req.body as MultistreamTarget;
  const data = await db.multistreamTarget.fillAndCreate({
    name: input.name,
    url: input.url,
    disabled: input.disabled,
    userId: req.user.id,
  });
  res.status(201);
  res.json(data);
});

target.delete("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const { id } = req.params;
  if (!(await db.multistreamTarget.hasAccess(id, req.user.id, isAdmin))) {
    return notFound(res);
  }
  await db.multistreamTarget.delete(id);

  res.status(204);
  res.end();
});

target.patch("/:id", async (req, res) => {
  const isAdmin = !!req.user.admin;
  const { id } = req.params;
  if (!(await db.multistreamTarget.hasAccess(id, req.user.id, isAdmin))) {
    return notFound(res);
  }
  const disabledPatch = req.body.disabled;
  if (typeof disabledPatch !== "boolean") {
    return respondError(res, 422, "required boolean field: disabled");
  }
  await db.multistreamTarget.update(id, { disabled: disabledPatch });
  res.status(204);
  res.end();
});

const app = Router();

app.use("/target", target);

export default app;
