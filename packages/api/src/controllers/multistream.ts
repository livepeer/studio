import { SQLStatement } from "sql-template-strings";
import mung from "express-mung";

import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Response, Router } from "express";
import {
  FieldsMap,
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import { db } from "../store";
import { FindOptions, FindQuery, WithID } from "../store/types";
import {
  MultistreamTarget,
  MultistreamTargetPatchPayload,
  User,
} from "../schema/types";
import { DBMultistreamTarget } from "../store/multistream-table";

const fieldsMap: FieldsMap = {
  id: `multistream_target.ID`,
  name: { val: `multistream_target.data->>'name'`, type: "full-text" },
  url: `multistream_target.data->>'url'`,
  disabled: { val: `multistream_target.data->'disabled'`, type: "boolean" },
  createdAt: { val: `multistream_target.data->'createdAt'`, type: "int" },
  userId: `multistream_target.data->>'userId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
};

function adminListQuery(
  limit: number,
  cursor: string,
  orderStr: string,
  filters: string
): [SQLStatement[], FindOptions] {
  type ResultRow = {
    id: string;
    data: DBMultistreamTarget;
    usersId: string;
    usersData: WithID<User>;
  };
  const fields =
    " multistream_target.id as id, multistream_target.data as data, users.id as usersId, users.data as usersData";
  const from = `multistream_target left join users on multistream_target.data->>'userId' = users.id`;
  const order = parseOrder(fieldsMap, orderStr);
  const process = ({ data, usersData }: ResultRow) => {
    return { ...data, user: db.user.cleanWriteOnlyResponse(usersData) };
  };

  const query = parseFilters(fieldsMap, filters);
  const opts = { limit, cursor, fields, from, order, process };
  return [query, opts];
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

target.get("/", authorizer({}), async (req, res) => {
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

target.get("/:id", authorizer({}), async (req, res) => {
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

target.post(
  "/",
  authorizer({}),
  validatePost("multistream-target"),
  async (req, res) => {
    const input = req.body as MultistreamTarget;
    const data = await db.multistreamTarget.fillAndCreate({
      name: input.name,
      url: input.url,
      disabled: input.disabled,
      userId: req.user.id,
    });
    res.status(201);
    res.json(data);
  }
);

target.delete("/:id", authorizer({}), async (req, res) => {
  const isAdmin = !!req.user.admin;
  const { id } = req.params;
  if (!(await db.multistreamTarget.hasAccess(id, req.user.id, isAdmin))) {
    return notFound(res);
  }
  await db.multistreamTarget.delete(id);

  res.status(204);
  res.end();
});

target.patch(
  "/:id",
  authorizer({}),
  validatePost("multistream-target-patch-payload"),
  async (req, res) => {
    const isAdmin = !!req.user.admin;
    const { id } = req.params;
    if (!(await db.multistreamTarget.hasAccess(id, req.user.id, isAdmin))) {
      return notFound(res);
    }
    const { disabled, name, url } = req.body as MultistreamTargetPatchPayload;
    let patch: Partial<DBMultistreamTarget> = {};
    if (typeof disabled === "boolean") {
      patch = { ...patch, disabled };
    }
    if (name) {
      patch = { ...patch, name };
    }
    if (url) {
      patch = { ...patch, url };
    }
    if (Object.keys(patch).length > 0) {
      await db.multistreamTarget.update(id, patch);
    }
    res.status(204);
    res.end();
  }
);

const app = Router();

app.use("/target", target);

export default app;
