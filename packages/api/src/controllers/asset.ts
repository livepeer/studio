import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Request, RequestHandler, Router } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import mung from "express-mung";
import _ from "lodash";
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
  InternalServerError,
} from "../store/errors";
import httpProxy from "http-proxy";
import { generateUniquePlaybackId } from "./generate-keys";
import {
  Asset,
  AssetPatchPayload,
  ExportTaskParams,
  IpfsFileInfo,
  NewAssetPayload,
  Task,
} from "../schema/types";
import { WithID } from "../store/types";
import { mergeStorageStatus } from "../store/asset-table";
import Queue from "../store/queue";

const app = Router();

const META_MAX_SIZE = 1024;

function validateAssetMeta(meta: Record<string, string>) {
  try {
    if (meta && JSON.stringify(meta).length > META_MAX_SIZE) {
      console.error(`provided meta exceeds max size of ${META_MAX_SIZE}`);
      throw new UnprocessableEntityError(
        `the provided meta exceeds max size of ${META_MAX_SIZE} characters`
      );
    }
  } catch (e) {
    console.error(`couldn't parse the provided meta ${meta}`);
    throw new UnprocessableEntityError(
      `the provided meta is not in a valid json format`
    );
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
  validateAssetMeta(payload.meta);
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
    status: {
      phase: "waiting",
      updatedAt: createdAt,
    },
    name: payload.name,
    meta: payload.meta,
    objectStoreId: payload.objectStoreId || defaultObjectStoreId,
  };
}

export function getPlaybackUrl(ingest: string, asset: WithID<Asset>): string {
  if (!asset.playbackRecordingId) {
    return undefined;
  }
  return pathJoin(
    ingest,
    "recordings",
    asset.playbackRecordingId,
    "index.m3u8"
  );
}

function withPlaybackUrls(ingest: string, asset: WithID<Asset>): WithID<Asset> {
  if (asset.status.phase !== "ready") {
    return asset;
  }
  return {
    ...asset,
    playbackUrl: getPlaybackUrl(ingest, asset),
    downloadUrl: pathJoin(ingest, "asset", asset.playbackId, "video"),
  };
}

const ipfsGateway = "https://ipfs.livepeer.studio/ipfs/";

export function withIpfsUrls<T extends Partial<IpfsFileInfo>>(ipfs: T): T {
  if (!ipfs?.cid) {
    return ipfs;
  }
  return {
    ...ipfs,
    url: `ipfs://${ipfs.cid}`,
    gatewayUrl: pathJoin(ipfsGateway, ipfs.cid),
  };
}

function assetWithIpfsUrls(asset: WithID<Asset>): WithID<Asset> {
  if (!asset?.storage?.ipfs?.cid) {
    return asset;
  }
  return _.merge({}, asset, {
    storage: {
      ipfs: {
        ...withIpfsUrls(asset.storage.ipfs),
        nftMetadata: withIpfsUrls(asset.storage.ipfs.nftMetadata),
      },
    },
  });
}

export async function createAsset(asset: WithID<Asset>, queue: Queue) {
  asset = await db.asset.create(asset);
  await queue.publishWebhook("events.asset.created", {
    type: "webhook_event",
    id: uuid(),
    timestamp: asset.createdAt,
    event: "asset.created",
    userId: asset.userId,
    payload: {
      asset: {
        id: asset.id,
        snapshot: asset,
      },
    },
  });
  return asset;
}

async function reconcileAssetStorage(
  { taskScheduler }: Request,
  asset: WithID<Asset>,
  newStorage: Asset["storage"],
  task?: WithID<Task>
): Promise<Asset["storage"]> {
  let { storage } = asset;
  const ipfsParamsEq = _.isEqual(
    newStorage.ipfs?.spec,
    storage?.ipfs?.spec ?? null
  );
  if ("ipfs" in newStorage && !ipfsParamsEq) {
    let newSpec = newStorage.ipfs?.spec;
    if (!newSpec) {
      throw new BadRequestError("Cannot remove asset from IPFS");
    }
    if (!task) {
      task = await taskScheduler.scheduleTask(
        "export",
        { export: { ipfs: newSpec } },
        asset
      );
    }
    storage = {
      ...storage,
      ipfs: {
        ...storage?.ipfs,
        spec: newSpec,
      },
      status: mergeStorageStatus(storage?.status, {
        phase: "waiting",
        tasks: { pending: task.id },
      }),
    };
  }
  return storage;
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
  mung.jsonAsync(async function cleanWriteOnlyResponses(
    data: WithID<Asset>[] | WithID<Asset> | { asset: WithID<Asset> },
    req
  ) {
    const ingests = await req.getIngest();
    if (!ingests.length) {
      throw new InternalServerError("Ingest not configured");
    }
    const ingest = ingests[0].base;
    let toExternalAsset = (a: WithID<Asset>) => {
      a = withPlaybackUrls(ingest, a);
      a = assetWithIpfsUrls(a);
      if (!req.user.admin) {
        a = db.asset.cleanWriteOnlyResponse(a) as WithID<Asset>;
      }
      return a;
    };

    if (Array.isArray(data)) {
      return data.map(toExternalAsset);
    }
    if ("id" in data) {
      return toExternalAsset(data);
    }
    if ("asset" in data) {
      return {
        ...data,
        asset: toExternalAsset(data.asset),
      };
    }
    return data;
  })
);

const fieldsMap: FieldsMap = {
  id: `asset.ID`,
  name: { val: `asset.data->>'name'`, type: "full-text" },
  objectStoreId: `asset.data->>'objectStoreId'`,
  createdAt: { val: `asset.data->'createdAt'`, type: "int" },
  updatedAt: { val: `asset.data->'status'->'updatedAt'`, type: "int" },
  userId: `asset.data->>'userId'`,
  playbackId: `asset.data->>'playbackId'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  meta: `asset.data->>'meta'`,
  cid: `asset.data->'storage'->'ipfs'->>'cid'`,
  nftMetadataCid: `asset.data->'storage'->'ipfs'->'nftMetadata'->>'cid'`,
};

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, all, allUsers, order, filters, count, ...otherQs } =
    toStringValues(req.query);
  const fieldFilters = _.pick(otherQs, "playbackId", "cid", "nftMetadataCid");
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  const query = [
    ...parseFilters(fieldsMap, filters),
    ...parseFilters(
      fieldsMap,
      JSON.stringify(_.map(fieldFilters, (v, k) => ({ id: k, value: v })))
    ),
  ];
  if (!all || all === "false") {
    // TODO: Consider keeping this flag as admin-only
    query.push(sql`asset.data->>'deleted' IS NULL`);
  }

  let output: WithID<Asset>[];
  let newCursor: string;
  if (req.user.admin && allUsers && allUsers !== "false") {
    let fields =
      " asset.id as id, asset.data as data, users.id as usersId, users.data as usersdata";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    const from = `asset left join users on asset.data->>'userId' = users.id`;
    [output, newCursor] = await db.asset.find(query, {
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
          ...data,
          user: db.user.cleanWriteOnlyResponse(usersdata),
        };
      },
    });
  } else {
    query.push(sql`asset.data->>'userId' = ${req.user.id}`);

    let fields = " asset.id as id, asset.data as data";
    if (count) {
      fields = fields + ", count(*) OVER() AS count";
    }
    [output, newCursor] = await db.asset.find(query, {
      limit,
      cursor,
      fields,
      order: parseOrder(fieldsMap, order),
      process: ({ data, count: c }) => {
        if (count) {
          res.set("X-Total-Count", c);
        }
        return data;
      },
    });
  }

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  return res.json(output);
});

app.get("/:id", authorizer({}), async (req, res) => {
  const asset = await db.asset.get(req.params.id);
  if (!asset) {
    throw new NotFoundError(`Asset not found`);
  }

  if (req.user.admin !== true && req.user.id !== asset.userId) {
    throw new ForbiddenError(
      "user can only request information on their own assets"
    );
  }

  res.json(asset);
});

app.post(
  "/:id/export",
  authorizer({}),
  validatePost("export-task-params"),
  async (req, res) => {
    const assetId = req.params.id;
    const asset = await db.asset.get(assetId);
    if (!asset) {
      throw new NotFoundError(`Asset not found with id ${assetId}`);
    }
    if (asset.status.phase !== "ready") {
      res.status(412);
      return res.json({ errors: ["asset is not ready to be exported"] });
    }
    if (req.user.id !== asset.userId) {
      throw new ForbiddenError(`User can only export their own assets`);
    }
    const params = req.body as ExportTaskParams;
    const task = await req.taskScheduler.scheduleTask(
      "export",
      { export: params },
      asset
    );
    if ("ipfs" in params && !params.ipfs?.pinata) {
      // TODO: Make this unsupported. PATCH should be the only way to change asset storage.
      console.warn(
        `Deprecated export to IPFS API used. userId=${req.user.id} assetId=${assetId}`
      );
      const storage = await reconcileAssetStorage(
        req,
        asset,
        { ipfs: { spec: params.ipfs } },
        task
      );
      await req.taskScheduler.updateAsset(asset, { storage });
    }

    res.status(201);
    res.json({ task });
  }
);

app.post(
  "/import",
  authorizer({}),
  validatePost("new-asset-payload"),
  async (req, res) => {
    const id = uuid();
    const playbackId = await generateUniquePlaybackId(id);
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

    asset = await createAsset(asset, req.queue);

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
  const playbackId = await generateUniquePlaybackId(id);
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
  outputAsset.sourceAssetId = inputAsset.sourceAssetId ?? inputAsset.id;
  outputAsset = await createAsset(outputAsset, req.queue);

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
  authorizer({}),
  validatePost("transcode-asset-payload"),
  transcodeAssetHandler
);
// TODO: Remove this at some point. Registered only for backward compatibility.
app.post(
  "/transcode",
  authorizer({}),
  validatePost("transcode-asset-payload"),
  transcodeAssetHandler
);

app.post(
  "/request-upload",
  authorizer({}),
  validatePost("new-asset-payload"),
  async (req, res) => {
    const id = uuid();
    let playbackId = await generateUniquePlaybackId(id);

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

    asset = await createAsset(asset, req.queue);
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
  if (asset.status.phase !== "waiting") {
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
  await db.asset.markDeleted(id);
  res.status(204);
  res.end();
});

app.patch(
  "/:id",
  authorizer({}),
  validatePost("asset-patch-payload"),
  async (req, res) => {
    // these are the only updateable fields
    let { name, meta, storage: storageInput } = req.body as AssetPatchPayload;
    validateAssetMeta(meta);

    let storage: Asset["storage"];
    if (storageInput?.ipfs !== undefined) {
      let { ipfs } = storageInput;
      if (typeof ipfs === "boolean" || !ipfs) {
        ipfs = { spec: ipfs ? {} : null };
      } else if (typeof ipfs.spec === "undefined") {
        ipfs = { spec: {} };
      }
      storage = { ...storageInput, ipfs };
    }

    // update a specific asset
    const { id } = req.params;
    const asset = await db.asset.get(id);
    if (!asset || (asset.userId !== req.user.id && !req.user.admin)) {
      throw new NotFoundError(`asset not found`);
    } else if (asset.status.phase !== "ready") {
      throw new UnprocessableEntityError(`asset is not ready`);
    }

    if (storage) {
      storage = await reconcileAssetStorage(req, asset, storage);
    }
    await req.taskScheduler.updateAsset(asset, { name, meta, storage });
    const updated = await db.asset.get(id, { useReplica: false });
    res.status(200).json(updated);
  }
);

// TODO: Call this in production until there are no assets left in old format.
// Then remove compatibility code and this API.
app.post(
  "/migrate-status",
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    let { limit, cursor, concurrency } = toStringValues(req.query);
    if (isNaN(parseInt(limit))) {
      limit = "100";
    }

    const query = [
      sql`asset.data->'storage'->>'ipfs' IS NOT NULL`,
      sql`asset.data->'storage'->'ipfs'->>'spec' IS NULL`,
    ];
    const fields = " asset.id as id, asset.data as data";
    const [toUpdate, nextCursor] = await db.asset.find(query, {
      limit,
      cursor,
      fields,
      order: "data->>'id' ASC",
    });

    let promises: Promise<void>[] = [];
    let batchSize = parseInt(concurrency);
    if (isNaN(batchSize) || batchSize < 1) {
      batchSize = 5;
    }
    for (const asset of toUpdate) {
      // the db.asset will actually already return the asset transformed to the
      // updated format. All we need to do is re-save it as returned here.
      promises.push(db.asset.replace(asset));
      if (promises.length >= batchSize) {
        await Promise.all(promises);
        promises = [];
      }
    }
    await Promise.all(promises);

    if (toUpdate.length > 0 && nextCursor) {
      res.links({ next: makeNextHREF(req, nextCursor) });
    }
    return res.status(200).json({
      count: toUpdate.length,
      nextCursor,
      updated: toUpdate,
    });
  }
);

export default app;
