import { authorizer, validatePost } from "../middleware";
import { Router } from "express";
import {
  FieldsMap,
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { v4 as uuid } from "uuid";
import { generateKeyPairSync } from "crypto";
import { ForbiddenError, NotFoundError } from "../store/errors";
import {
  SigningKey,
  SigningKeyPatchPayload,
  SigningKeyResponsePayload,
} from "../schema/types";
import { WithID } from "../store/types";

const fieldsMap: FieldsMap = {
  id: `signing_key.ID`,
  name: { val: `signing_key.data->>'name'`, type: "full-text" },
  deleted: { val: `signing_key.data->'deleted'`, type: "boolean" },
  createdAt: { val: `signing_key.data->'createdAt'`, type: "int" },
  userId: `signing_key.data->>'userId'`,
};

function generateSigningKeys() {
  const keypair = generateKeyPairSync("ec", {
    namedCurve: "P-521",
    publicKeyEncoding: {
      type: "spki",
      format: "jwk",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  return keypair;
}

const app = Router();

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, all, allUsers, order, filters, count } = toStringValues(
    req.query
  );
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  if (req.user.admin && allUsers && allUsers !== "false") {
    const query = parseFilters(fieldsMap, filters);
    if (!all || all === "false") {
      query.push(sql`signing_key.data->>'deleted' IS NULL`);
    }

    let fields =
      " signing_key.id as id, signing_key.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `signing_key left join users on signing_key.data->>'userId' = users.id`;
    const [output, newCursor] = await db.signingKey.find(query, {
      limit,
      cursor,
      fields,
      from,
      order: parseOrder(fieldsMap, order),
      process: ({ data, usersdata, count: c }) => {
        if (count) {
          res.set("X-Total-Count", c);
        }
        return {
          data,
          user: db.user.cleanWriteOnlyResponse(usersdata),
        };
      },
    });

    res.status(200);

    if (output.length > 0 && newCursor) {
      res.links({ next: makeNextHREF(req, newCursor) });
    }
    return res.json(output);
  }

  const query = parseFilters(fieldsMap, filters);
  query.push(sql`signing_key.data->>'userId' = ${req.user.id}`);
  query.push(sql`signing_key.data->>'deleted' IS NULL`);

  let fields = " signing_key.id as id, signing_key.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `signing_key`;
  const [output, newCursor] = await db.signingKey.find(query, {
    limit,
    cursor,
    fields,
    from,
    order: parseOrder(fieldsMap, order),
    process: ({ data, count: c }) => {
      if (count) {
        res.set("X-Total-Count", c);
      }
      return data;
    },
  });

  res.status(200);

  if (output.length > 0) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:id", authorizer({}), async (req, res) => {
  const signingKey = await db.signingKey.get(req.params.id);

  if (
    !signingKey ||
    signingKey.deleted ||
    (req.user.admin !== true && req.user.id !== signingKey.userId)
  ) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }

  res.json(signingKey);
});

app.post(
  "/",
  validatePost("new-signing-key-payload"),
  authorizer({}),
  async (req, res) => {
    const query = parseFilters(fieldsMap, "");
    query.push(sql`signing_key.data->>'userId' = ${req.user.id}`);
    query.push(sql`signing_key.data->>'deleted' IS NULL`);
    const [output] = await db.signingKey.find(query, {
      limit: 100,
      fields: " signing_key.id as id, signing_key.data as data",
      from: `signing_key`,
      order: parseOrder(fieldsMap, "createdAt-true"),
      process: ({ data }) => {
        return data;
      },
    });

    if (output.length > 10) {
      res.status(403);
      return res.json({
        errors: ["user can only have up to 10 signing keys, delete some first"],
      });
    }

    const id = uuid();
    const keypair = generateSigningKeys();

    let b64PublicKey = Buffer.from(JSON.stringify(keypair.publicKey)).toString(
      "base64"
    );

    var doc: WithID<SigningKey> = {
      id,
      name: req.body.name || "Signing Key " + (output.length + 1),
      userId: req.user.id,
      createdAt: Date.now(),
      publicKey: b64PublicKey,
    };

    await db.signingKey.create(doc);

    var createdSigningKey: SigningKeyResponsePayload = {
      ...doc,
      privateKey: keypair.privateKey.toString(),
    };

    res.status(201);
    res.json(createdSigningKey);
  }
);

app.delete("/:id", authorizer({}), async (req, res) => {
  const { id } = req.params;
  const signingKey = await db.signingKey.get(id);
  if (!signingKey || signingKey.deleted) {
    throw new NotFoundError(`signing key not found`);
  }
  if (!req.user.admin && req.user.id !== signingKey.userId) {
    throw new ForbiddenError(`users may only delete their own signing keys`);
  }
  await db.signingKey.markDeleted(signingKey.id);
  res.status(204);
  res.end();
});

app.patch(
  "/:id",
  validatePost("signing-key-patch-payload"),
  authorizer({}),
  async (req, res) => {
    const { id } = req.params;
    const signingKey = await db.signingKey.get(id);
    if (!signingKey || signingKey.deleted) {
      return res.status(404).json({ errors: ["not found"] });
    }
    if (!req.user.admin && req.user.id !== signingKey.userId) {
      return res.status(403).json({
        errors: ["users may change only their own signing key"],
      });
    }
    const payload = req.body as SigningKeyPatchPayload;
    console.log(
      `patch signing key id=${id} payload=${JSON.stringify(
        JSON.stringify(payload)
      )}`
    );
    await db.signingKey.update(id, payload);
    res.status(204).end();
  }
);

export default app;
