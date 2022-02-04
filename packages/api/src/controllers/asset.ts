import { URL } from "url";
import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import logger from "../logger";
import uuid from "uuid/v4";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  getS3PresignedUrl,
  FieldsMap,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import { UnprocessableEntityError } from "../store/errors";
import httpProxy from "http-proxy";
import { generateStreamKey } from "./generate-stream-key";
import { IStore } from "../types/common";

const app = Router();

const META_MAX_SIZE = 1024;

async function generateUniquePlaybackId(store: IStore, otherKeys: string[]) {
  while (true) {
    const playbackId: string = await generateStreamKey();
    const qres = await store.query({
      kind: "asset",
      query: { playbackId },
    });
    if (!qres.data.length && !otherKeys.includes(playbackId)) {
      return playbackId;
    }
  }
}

function validateAssetPayload(id, userId, createdAt, payload) {
  try {
    if (payload.meta && JSON.stringify(payload.meta).length > META_MAX_SIZE) {
      console.error(`provided meta exceeds max size of ${META_MAX_SIZE}`);
      throw new UnprocessableEntityError(
        `the provided meta exceeds max size of ${META_MAX_SIZE} characters`
      );
    }
  } catch (e) {
    console.error(`couldn't parse the provided meta ${payload.meta}`);
    throw new UnprocessableEntityError(
      `the provided meta is not in a valid json format`
    );
  }

  return {
    id,
    userId,
    createdAt,
    name: payload.name,
    meta: payload.meta,
    hash: payload.hash,
  };
}

const fieldsMap: FieldsMap = {
  id: `asset.ID`,
  name: { val: `asset.data->>'name'`, type: "full-text" },
  objectStoreId: `asset.data->>'objectStoreId'`,
  createdAt: `asset.data->'createdAt'`,
  userId: `asset.data->>'userId'`,
  playbackId: `asset.data->>'playbackId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  meta: `asset.data->>'meta'`,
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
      query.push(sql`asset.data->>'deleted' IS NULL`);
    }

    let fields =
      " asset.id as id, asset.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `asset left join users on asset.data->>'userId' = users.id`;
    const [output, newCursor] = await db.asset.find(query, {
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
  query.push(sql`asset.data->>'userId' = ${req.user.id}`);

  if (!all || all === "false") {
    query.push(sql`asset.data->>'deleted' IS NULL`);
  }

  let fields = " asset.id as id, asset.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  const from = `asset`;
  const [output, newCursor] = await db.asset.find(query, {
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
  const os = await db.asset.get(req.params.id);
  if (!os) {
    res.status(404);
    return res.json({
      errors: ["not found"],
    });
  }

  if (req.user.admin !== true && req.user.id !== os.userId) {
    res.status(403);
    return res.json({
      errors: ["user can only request information on their own assets"],
    });
  }

  res.json(os);
});

app.post("/", authMiddleware({}), validatePost("asset"), async (req, res) => {
  const id = uuid();
  const doc = validateAssetPayload(id, req.user.id, Date.now(), req.body);
  if (!req.user.admin) {
    res.status(403);
    return res.json({ errors: ["Forbidden"] });
  }
  await db.asset.create(doc);

  res.status(201);
  res.json(doc);
});

app.post("/import", authMiddleware({}), async (req, res) => {
  const id = uuid();
  const asset = validateAssetPayload(id, req.user.id, Date.now(), req.body);
  if (!req.body.url) {
    res.status(400);
    return res.json({ errors: ["You must provide a url to import an asset"] });
  }

  await db.asset.create(asset);
  const taskId = uuid();

  // TODO: move the task creation and spawn into task store
  let task = await db.task.create({
    id: taskId,
    name: "asset-import",
    type: "Import",
    parentAssetId: asset.id,
    userId: asset.userId,
    params: {
      import: {
        url: req.body.url,
      },
    },
  });

  await req.queue.publish("task", "task.trigger.import", {
    type: "task_trigger",
    id: uuid(),
    timestamp: Date.now(),
    task: task,
    event: "asset.import",
  });

  res.status(201);
  res.end();
});

app.post("/request-upload", authMiddleware({}), async (req, res) => {
  const id = uuid();
  let playbackId = await generateUniquePlaybackId(req.store, [id]);
  playbackId = playbackId.replace(/-/g, "");

  const { vodObjectStoreId } = req.config;
  const presignedUrl = await getS3PresignedUrl({
    objectKey: `${playbackId}/source`,
    vodObjectStoreId,
  });

  const b64SignedUrl = Buffer.from(presignedUrl).toString("base64");
  const lpSignedUrl = `https://${req.frontendDomain}/api/asset/upload/${b64SignedUrl}`;

  await db.asset.create({
    id,
    name: "",
    playbackId,
    userId: req.user.id,
  });

  res.json({ url: lpSignedUrl, playbackId: playbackId });
});

app.put("/upload/:url", async (req, res) => {
  const { url } = req.params;
  let uploadUrl = Buffer.from(url, "base64").toString();
  let bucket = uploadUrl.match(/https:\/\/(.*)\/./)[1].split(".")[0];
  let playbackId = uploadUrl.split(`/${bucket}/`)[1].split("/")[0];
  const obj = await db.asset.find({ playbackId: playbackId });

  if (obj?.length) {
    let asset = obj[0][0];
    var proxy = httpProxy.createProxyServer({});

    proxy.on("end", async function (proxyReq, _, res) {
      if (res.statusCode == 200) {
        const taskId = uuid();

        // TODO: move the task creation and spawn into task store
        let task = await db.task.create({
          id: taskId,
          name: "asset-upload",
          type: "Import",
          parentAssetId: asset.id,
          userId: asset.userId,
        });

        await req.queue.publish("task", "task.trigger.upload", {
          type: "task_trigger",
          id: uuid(),
          timestamp: Date.now(),
          task: task,
          playbackId: playbackId,
          event: "asset.upload",
        });
      }
    });

    proxy.web(req, res, {
      target: uploadUrl,
      changeOrigin: true,
      ignorePath: true,
    });
  } else {
    res.status(400);
    return res.json({
      errors: ["the asset does not exist"],
    });
  }
});

app.delete("/:id", authMiddleware({}), async (req, res) => {
  const { id } = req.params;
  const asset = await db.asset.get(id);
  if (!asset) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }
  if (!req.user.admin && req.user.id !== asset.userId) {
    res.status(403);
    return res.json({
      errors: ["users may only delete their own assets"],
    });
  }
  await db.asset.delete(id);
  res.status(204);
  res.end();
});

app.patch(
  "/:id",
  authMiddleware({}),
  validatePost("asset"),
  async (req, res) => {
    // update a specific asset
    const asset = await db.asset.get(req.body.id);
    if (!req.user.admin) {
      // do not reveal that asset exists
      res.status(403);
      return res.json({ errors: ["Forbidden"] });
    }

    const { id, userId, createdAt } = asset;
    const doc = validateAssetPayload(id, userId, createdAt, req.body);

    await db.asset.update(req.body.id, doc);

    res.status(200);
    res.json({ id: req.body.id });
  }
);

export default app;
