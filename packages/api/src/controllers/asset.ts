import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  getS3PresignedUrl,
  FieldsMap,
  toStringValues,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  ForbiddenError,
  UnprocessableEntityError,
  NotFoundError,
} from "../store/errors";
import httpProxy from "http-proxy";
import { generateStreamKey } from "./generate-stream-key";
import { IStore } from "../types/common";
import { Asset } from "../schema/types";
import { WithID } from "../store/types";

const app = Router();

const META_MAX_SIZE = 1024;

async function generateUniquePlaybackId(store: IStore, assetId: string) {
  const shardKey = assetId.substring(0, 4);
  while (true) {
    const playbackId: string = await generateStreamKey();
    const qres = await store.query({
      kind: "asset",
      query: { playbackId },
    });
    if (!qres.data.length && playbackId != assetId) {
      const shardedId = shardKey + playbackId.slice(shardKey.length);
      return shardedId.replace(/-/g, "");
    }
  }
}

async function validateAssetPayload(
  id: string,
  playbackId: string,
  userId: string,
  createdAt: number,
  defaultObjectStoreId: string,
  // TODO: This could be just a new schema like `import-asset-payload`
  payload: any
): Promise<WithID<Asset>> {
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
  if (payload.objectStoreId) {
    const os = await db.objectStore.get(payload.objectStoreId);
    if (os.userId !== userId) {
      throw new ForbiddenError(
        `the provided objectStoreId is not owned by the user`
      );
    }
  }

  return {
    id,
    playbackId,
    userId,
    createdAt,
    status: "waiting",
    name: payload.name,
    meta: payload.meta,
    objectStoreId: payload.objectStoreId || defaultObjectStoreId,
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
    toStringValues(req.query);
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
  const asset = await db.asset.get(req.params.id);
  if (!asset) {
    throw new NotFoundError(`Asset not found`);
  }

  if (req.user.admin !== true && req.user.id !== asset.userId) {
    throw new ForbiddenError(
      `      errors: ["user can only request information on their own assets"],
      `
    );
  }

  res.json(asset);
});

app.post("/export", authMiddleware({}), async (req, res) => {
  const assetId = req.body.assetId;
  const asset = await db.asset.get(assetId);
  if (!asset) {
    throw new NotFoundError(`Asset not found with id ${assetId}`);
  }
  if (req.user.id !== asset.userId) {
    throw new ForbiddenError(`User can only export their own assets`);
  }

  await req.taskScheduler.scheduleTask(
    "export",
    {
      ipfs: req.body.ipfs,
      url: req.body.url,
    },
    asset
  );

  res.status(201);
  res.end();
});

app.post("/import", authMiddleware({}), async (req, res) => {
  const id = uuid();
  const playbackId = await generateUniquePlaybackId(req.store, id);
  const asset = await validateAssetPayload(
    id,
    playbackId,
    req.user.id,
    Date.now(),
    req.config.vodObjectStoreId,
    req.body
  );
  if (!req.body.url) {
    return res.status(422).json({
      errors: ["You must provide a url from which import an asset"],
    });
  }

  await db.asset.create(asset);

  await req.taskScheduler.scheduleTask(
    "import",
    {
      url: req.body.url,
    },
    undefined,
    asset
  );

  res.status(201);
  res.end();
});

app.post("/request-upload", authMiddleware({}), async (req, res) => {
  const id = uuid();
  let playbackId = await generateUniquePlaybackId(req.store, id);

  const { vodObjectStoreId } = req.config;
  const presignedUrl = await getS3PresignedUrl({
    objectKey: `directUpload/${playbackId}/source`,
    vodObjectStoreId,
  });

  const b64SignedUrl = Buffer.from(presignedUrl).toString("base64");
  const lpSignedUrl = `https://${req.frontendDomain}/api/asset/upload/${b64SignedUrl}`;

  // TODO: use the same function as the one used in import
  await db.asset.create({
    id,
    name: `asset-upload-${id}`,
    playbackId,
    userId: req.user.id,
    objectStoreId: vodObjectStoreId,
  });
  res.json({ url: lpSignedUrl, playbackId: playbackId });
});

app.put("/upload/:url", async (req, res) => {
  const { url } = req.params;
  let uploadUrl = Buffer.from(url, "base64").toString();

  // get playbackId from s3 url
  let playbackId;
  try {
    playbackId = uploadUrl.match(
      /^https:\/\/storage.googleapis.com\/[^/]+\/directUpload\/([^/]+)/
    )[1];
    console.log(`playbackId: ${playbackId}`);
  } catch (e) {
    throw new UnprocessableEntityError(
      `the provided url for the upload is not valid or not supported: ${uploadUrl}`
    );
  }
  const obj = await db.asset.find({ playbackId: playbackId });

  if (obj?.length) {
    let asset = obj[0][0];
    var proxy = httpProxy.createProxyServer({});

    proxy.on("end", async function (proxyReq, _, res) {
      if (res.statusCode == 200) {
        await req.taskScheduler.scheduleTask(
          "import",
          {
            uploadedObjectKey: `directUpload/${playbackId}/source`,
          },
          undefined,
          asset
        );
      } else {
        console.log(
          `assetUpload: Proxy upload to s3 on url ${uploadUrl} failed with status code: ${res.statusCode}`
        );
      }
    });

    proxy.web(req, res, {
      target: uploadUrl,
      changeOrigin: true,
      ignorePath: true,
    });
  } else {
    // we expect an existing asset to be found
    throw new NotFoundError(`related asset not found`);
  }
});

app.delete("/:id", authMiddleware({}), async (req, res) => {
  const { id } = req.params;
  const asset = await db.asset.get(id);
  if (!asset) {
    throw new NotFoundError(`Asset not found`);
  }
  if (!req.user.admin && req.user.id !== asset.userId) {
    throw new ForbiddenError(`users may only delete their own assets`);
  }
  await db.asset.delete(id);
  res.status(204);
  res.end();
});

// TODO: Delete this API as well?
app.patch(
  "/:id",
  authMiddleware({ anyAdmin: true }),
  validatePost("asset"),
  async (req, res) => {
    // update a specific asset
    const asset = await db.asset.get(req.body.id);
    if (!req.user.admin) {
      // do not reveal that asset exists
      throw new ForbiddenError(`Forbidden`);
    }

    const { id, userId, createdAt } = asset;
    const playbackId = await generateUniquePlaybackId(req.store, id);
    const doc = await validateAssetPayload(
      id,
      playbackId,
      userId,
      createdAt,
      req.config.vodObjectStoreId,
      req.body
    );

    await db.asset.update(req.body.id, doc);

    res.status(200);
    res.json({ id: req.body.id });
  }
);

export default app;
