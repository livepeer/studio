import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { RequestHandler, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
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
import { Asset, ExportTaskParams, NewAssetPayload } from "../schema/types";
import { WithID } from "../store/types";

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

const assetStatus = (asset: Asset) =>
  typeof asset.status === "object"
    ? asset.status
    : {
        phase: asset.status,
        updatedAt: asset.updatedAt,
      };

function withPlaybackUrls(asset: WithID<Asset>, ingest: string): WithID<Asset> {
  if (asset.status !== "ready") {
    return asset;
  }
  if (asset.playbackRecordingId) {
    asset.playbackUrl = pathJoin(
      ingest,
      "recordings",
      asset.playbackRecordingId,
      "index.m3u8"
    );
  }
  return {
    ...asset,
    downloadUrl: pathJoin(ingest, "asset", asset.playbackId, "video"),
  };
}

async function genUploadUrl(
  playbackId: string,
  objectStoreId: string,
  jwtSecret: string,
  aud: string
) {
  const uploadedObjectKey = `directUpload/${playbackId}/source`;
  const presignedUrl = await getS3PresignedUrl(
    objectStoreId,
    uploadedObjectKey
  );
  const signedUploadUrl = jwt.sign({ presignedUrl, aud }, jwtSecret, {
    algorithm: "HS256",
  });
  return { uploadedObjectKey, signedUploadUrl };
}

function parseUploadUrl(
  signedUploadUrl: string,
  jwtSecret: string,
  audience: string
) {
  let uploadUrl: string;
  try {
    const urlJwt = jwt.verify(signedUploadUrl, jwtSecret, {
      audience,
    }) as JwtPayload;
    uploadUrl = urlJwt.presignedUrl;
  } catch (err) {
    throw new ForbiddenError(`Invalid signed upload URL: ${err}`);
  }

  // get playbackId from s3 url
  const matches = uploadUrl.match(/\/directUpload\/([^/]+)\/source/);
  if (!matches || matches.length < 2) {
    throw new UnprocessableEntityError(
      `the provided url for the upload is not valid or not supported: ${uploadUrl}`
    );
  }
  const playbackId = matches[1];
  return { uploadUrl, playbackId };
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

app.get("/", authorizer({}), async (req, res) => {
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
          ...withPlaybackUrls(data, ingest),
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
      return withPlaybackUrls(data, ingest);
    },
  });
  res.status(200);

  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

app.get("/:id", authorizer({ allowCorsApiKey: true }), async (req, res) => {
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

  res.json(withPlaybackUrls(asset, ingest));
});

app.post(
  "/:id/export",
  validatePost("export-task-params"),
  authorizer({ allowCorsApiKey: true }),
  async (req, res) => {
    const assetId = req.params.id;
    const asset = await db.asset.get(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset not found with id ${assetId}`);
    }
    const status = assetStatus(asset);
    if (status.phase !== "ready") {
      res.status(412);
      return res.json({ errors: ["asset is not ready to be exported"] });
    }
    if (req.user.id !== asset.userId) {
      throw new ForbiddenError(`User can only export their own assets`);
    }
    const params = req.body as ExportTaskParams;
    const task = await req.taskScheduler.scheduleTask(
      "export",
      {
        export: params,
      },
      asset
    );
    if ("ipfs" in params && !params.ipfs.pinata) {
      await db.asset.update(assetId, {
        storage: {
          ...asset.storage,
          ipfs: params.ipfs,
        },
        status: {
          ...status,
          storage: {
            ...status.storage,
            ipfs: {
              ...status.storage?.ipfs,
              taskIds: {
                ...status.storage?.ipfs?.taskIds,
                pending: task.id,
              },
            },
          },
        },
      });
    }

    res.status(201);
    res.json({ task });
  }
);

app.post(
  "/import",
  validatePost("new-asset-payload"),
  authorizer({}),
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

// /:id/transcode and /transcode routes registered right below
const transcodeAssetHandler: RequestHandler = async (req, res) => {
  if (!req.params?.id && !req.body.assetId) {
    // called from the old `/api/asset/transcode` endpoint
    throw new BadRequestError(
      "Missing `assetId` payload field of the input asset"
    );
  }
  if (req.params?.id && req.body.assetId) {
    // called from the new `/api/asset/:assetId/transcode` endpoint
    throw new BadRequestError(
      "Field `assetId` is not allowed in payload when included in the URL"
    );
  }
  const assetId = req.params?.id || req.body.assetId;

  const inputAsset = await db.asset.get(assetId);
  if (!inputAsset) {
    throw new NotFoundError(`asset not found`);
  }

  const os = await db.objectStore.get(inputAsset.objectStoreId);
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
      name: req.body.name ?? inputAsset.name,
    }
  );
  outputAsset.sourceAssetId = inputAsset.id;
  outputAsset = await db.asset.create(outputAsset);

  const task = await req.taskScheduler.scheduleTask(
    "transcode",
    {
      transcode: {
        profile: req.body.profile,
      },
    },
    inputAsset,
    outputAsset
  );
  res.status(201);
  res.json({ asset: outputAsset, task });
};
app.post(
  "/:id/transcode",
  validatePost("transcode-asset-payload"),
  authorizer({ allowCorsApiKey: true }),
  transcodeAssetHandler
);
// TODO: Remove this at some point. Registered only for backward compatibility.
app.post(
  "/transcode",
  validatePost("transcode-asset-payload"),
  authorizer({ allowCorsApiKey: true }),
  transcodeAssetHandler
);

app.post(
  "/request-upload",
  validatePost("new-asset-payload"),
  authorizer({ allowCorsApiKey: true }),
  async (req, res) => {
    const id = uuid();
    let playbackId = await generateUniquePlaybackId(req.store, id);

    const { vodObjectStoreId, jwtSecret, jwtAudience } = req.config;
    let asset = await validateAssetPayload(
      id,
      playbackId,
      req.user.id,
      Date.now(),
      vodObjectStoreId,
      { name: `asset-upload-${id}`, ...req.body }
    );
    const { uploadedObjectKey, signedUploadUrl } = await genUploadUrl(
      playbackId,
      asset.objectStoreId,
      jwtSecret,
      jwtAudience
    );

    const ingests = await req.getIngest();
    if (!ingests.length) {
      res.status(501);
      return res.json({ errors: ["Ingest not configured"] });
    }
    const baseUrl = ingests[0].origin;
    const url = `${baseUrl}/api/asset/upload/${signedUploadUrl}`;

    asset = await db.asset.create(asset);
    const task = await req.taskScheduler.createTask(
      "import",
      {
        import: { uploadedObjectKey },
      },
      null,
      asset
    );

    res.json({ url, asset, task });
  }
);

app.put("/upload/:url", async (req, res) => {
  const {
    params: { url },
    config: { jwtSecret, jwtAudience },
  } = req;
  const { uploadUrl, playbackId } = parseUploadUrl(url, jwtSecret, jwtAudience);

  const assets = await db.asset.find({ playbackId }, { useReplica: false });
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

app.delete("/:id", authorizer({}), async (req, res) => {
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

app.patch("/:id", authorizer({}), validatePost("asset"), async (req, res) => {
  // update a specific asset
  const { id } = req.params;
  const asset = await db.asset.get(id);
  if (!asset) {
    throw new NotFoundError(`asset not found`);
  }

  // these are the only updateable fields
  const { name, storage } = req.body as Asset;
  if (storage?.ipfs?.pinata) {
    throw new BadRequestError("Custom pinata not allowed in asset storage");
  }

  let status = assetStatus(asset);
  const ipfsParamsEq =
    JSON.stringify(storage.ipfs) === JSON.stringify(asset.storage?.ipfs);
  if (!ipfsParamsEq) {
    if (!storage.ipfs) {
      throw new BadRequestError("Cannot remove asset from IPFS");
    }
    const { id: taskId } = await req.taskScheduler.scheduleTask(
      "export",
      { export: { ipfs: storage.ipfs } },
      asset
    );
    status = {
      ...status,
      storage: {
        ...status.storage,
        ipfs: {
          ...status.storage?.ipfs,
          taskIds: {
            ...status.storage?.ipfs?.taskIds,
            pending: taskId,
          },
        },
      },
    };
  }
  await db.asset.update(id, {
    name,
    storage: { ...asset.storage, ...storage },
    status,
  });
  const updated = await db.asset.get(id, { useReplica: false });
  res.status(200).json(updated);
});

export default app;
