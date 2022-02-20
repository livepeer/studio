import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import mung from "express-mung";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  getS3PresignedUrl,
  FieldsMap,
  toStringValues,
  pathJoin,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  ForbiddenError,
  UnprocessableEntityError,
  NotFoundError,
  BadRequestError,
} from "../store/errors";
import httpProxy from "http-proxy";
import { generateStreamKey } from "./generate-stream-key";
import { Asset, NewAssetPayload } from "../schema/types";
import { WithID } from "../store/types";
import cors from "cors";

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const app = Router();

const META_MAX_SIZE = 1024;

export async function generateUniquePlaybackId(store: any, assetId: string) {
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
  payload: NewAssetPayload
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

function withDownloadUrl(asset: WithID<Asset>, ingest: string): WithID<Asset> {
  if (asset.status !== "ready") {
    return asset;
  }
  return {
    ...asset,
    downloadUrl: pathJoin(ingest, "asset", asset.playbackId, "video"),
  };
}

app.use(
  mung.json(function cleanWriteOnlyResponses(
    data: WithID<Asset>[] | WithID<Asset> | { asset: WithID<Asset> },
    req
  ) {
    if (req.user.admin) {
      return data;
    }
    if (Array.isArray(data)) {
      return db.asset.cleanWriteOnlyResponses(data);
    }
    if ("id" in data) {
      return db.asset.cleanWriteOnlyResponse(data);
    }
    if ("asset" in data) {
      return { ...data, asset: db.asset.cleanWriteOnlyResponse(data.asset) };
    }
    return data;
  })
);

const fieldsMap: FieldsMap = {
  id: `asset.ID`,
  name: { val: `asset.data->>'name'`, type: "full-text" },
  objectStoreId: `asset.data->>'objectStoreId'`,
  createdAt: { val: `asset.data->'createdAt'`, type: "int" },
  updatedAt: { val: `asset.data->'updatedAt'`, type: "int" },
  userId: `asset.data->>'userId'`,
  playbackId: `asset.data->>'playbackId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  meta: `asset.data->>'meta'`,
};

app.get("/", cors(corsOptions), authMiddleware({}), async (req, res) => {
  let { limit, cursor, all, event, allUsers, order, filters, count } =
    toStringValues(req.query);
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }
  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }
  const ingest = ingests[0].base;

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
        return {
          ...withDownloadUrl(data, ingest),
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
      return withDownloadUrl(data, ingest);
    },
  });
  res.status(200);

  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:id", cors(corsOptions), authMiddleware({}), async (req, res) => {
  const ingests = await req.getIngest();
  if (!ingests.length) {
    res.status(501);
    return res.json({ errors: ["Ingest not configured"] });
  }

  const ingest = ingests[0].base;
  const asset = await db.asset.get(req.params.id);
  if (!asset) {
    throw new NotFoundError(`Asset not found`);
  }

  if (req.user.admin !== true && req.user.id !== asset.userId) {
    throw new ForbiddenError(
      "user can only request information on their own assets"
    );
  }

  res.json(withDownloadUrl(asset, ingest));
});

app.post(
  "/:id/export",
  cors(corsOptions),
  validatePost("export-task-params"),
  authMiddleware({}),
  async (req, res) => {
    const assetId = req.params.id;
    const asset = await db.asset.get(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset not found with id ${assetId}`);
    }
    if (asset.status !== "ready") {
      res.status(412);
      return res.json({ errors: ["asset is not ready to be exported"] });
    }
    if (req.user.id !== asset.userId) {
      throw new ForbiddenError(`User can only export their own assets`);
    }
    const task = await req.taskScheduler.scheduleTask(
      "export",
      {
        export: req.body,
      },
      asset
    );

    res.status(201);
    res.json({ task });
  }
);

app.post(
  "/import",
  cors(corsOptions),
  validatePost("new-asset-payload"),
  authMiddleware({}),
  async (req, res) => {
    const id = uuid();
    const playbackId = await generateUniquePlaybackId(req.store, id);
    let asset = await validateAssetPayload(
      id,
      playbackId,
      req.user.id,
      Date.now(),
      req.config.vodObjectStoreId,
      req.body
    );
    if (!req.body.url) {
      return res.status(422).json({
        errors: [`Must provide a "url" field for the asset contents`],
      });
    }

    asset = await db.asset.create(asset);

    const task = await req.taskScheduler.scheduleTask(
      "import",
      {
        import: {
          url: req.body.url,
        },
      },
      undefined,
      asset
    );

    res.status(201);
    res.json({ asset, task });
  }
);

app.post(
  "/transcode",
  cors(corsOptions),
  validatePost("new-transcode-payload"),
  authMiddleware({}),
  async (req, res) => {
    if (!req.body.assetId) {
      throw new BadRequestError("You must provide a assetId of an asset");
    }
    const asset = await db.asset.get(req.body.assetId);
    if (!asset) {
      throw new NotFoundError(`asset not found`);
    }

    const os = await db.objectStore.get(asset.objectStoreId);
    if (!os) {
      throw new UnprocessableEntityError("Asset has invalid objectStoreId");
    }
    const id = uuid();
    const playbackId = await generateUniquePlaybackId(req.store, id);
    let outputAsset = await validateAssetPayload(
      id,
      playbackId,
      req.user.id,
      Date.now(),
      req.config.vodObjectStoreId,
      {
        name: req.body.name ?? asset.name,
      }
    );
    outputAsset.sourceAssetId = asset.id;
    outputAsset = await db.asset.create(outputAsset);

    const task = await req.taskScheduler.scheduleTask(
      "transcode",
      {
        transcode: {
          profile: req.body.profile,
        },
      },
      asset,
      outputAsset
    );
    res.status(201);
    res.json({ asset, task });
  }
);

app.post(
  "/request-upload",
  cors(corsOptions),
  validatePost("new-asset-payload"),
  authMiddleware({}),
  async (req, res) => {
    const id = uuid();
    let playbackId = await generateUniquePlaybackId(req.store, id);

    let asset = await validateAssetPayload(
      id,
      playbackId,
      req.user.id,
      Date.now(),
      req.config.vodObjectStoreId,
      { name: `asset-upload-${id}`, ...req.body }
    );
    const uploadedObjectKey = `directUpload/${playbackId}/source`;
    const presignedUrl = await getS3PresignedUrl(
      asset.objectStoreId,
      uploadedObjectKey
    );
    const task = await req.taskScheduler.createTask(
      "import",
      {
        import: { uploadedObjectKey },
      },
      null,
      asset
    );

    const b64SignedUrl = encodeURIComponent(
      Buffer.from(presignedUrl).toString("base64")
    );

    const ingests = await req.getIngest();
    if (!ingests.length) {
      res.status(501);
      return res.json({ errors: ["Ingest not configured"] });
    }
    const baseUrl = ingests[0].origin;
    const url = `${baseUrl}/api/asset/upload/${b64SignedUrl}`;

    asset = await db.asset.create(asset);

    res.json({ url, asset, task });
  }
);

app.put("/upload/:url", cors(corsOptions), async (req, res) => {
  const { url } = req.params;
  let uploadUrl = decodeURIComponent(Buffer.from(url, "base64").toString());

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
  const assets = await db.asset.find(
    { playbackId: playbackId },
    { useReplica: false }
  );
  if (!assets?.length || !assets[0]?.length) {
    throw new NotFoundError(`asset not found`);
  }
  let asset = assets[0][0];
  if (asset.status !== "waiting") {
    throw new UnprocessableEntityError(`asset has already been uploaded`);
  }

  const tasks = await db.task.find(
    { outputAssetId: asset.id },
    { useReplica: false }
  );
  if (!tasks?.length && !tasks[0]?.length) {
    throw new NotFoundError(`task not found`);
  }
  const task = tasks[0][0];
  if (task.status?.phase !== "pending") {
    throw new UnprocessableEntityError(`asset has already been uploaded`);
  }

  var proxy = httpProxy.createProxyServer({});
  proxy.on("end", async function (proxyReq, _, res) {
    if (res.statusCode == 200) {
      // TODO: Find a way to return the task in the response
      await req.taskScheduler.enqueueTask(task);
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
    if (!asset) {
      throw new NotFoundError(`asset not found`);
    }

    const { id, playbackId, userId, createdAt, objectStoreId } = asset;
    await db.asset.update(req.body.id, {
      ...req.body,
      // these fields are not updateable
      id,
      playbackId,
      userId,
      createdAt,
      updatedAt: Date.now(),
      objectStoreId,
    });

    res.status(200);
    res.json({ id: req.body.id });
  }
);

export default app;
