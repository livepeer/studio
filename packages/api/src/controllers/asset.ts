import { authorizer } from "../middleware";
import { validatePost } from "../middleware";
import { Request, RequestHandler, Router, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import {
  Server as TusServer,
  EVENTS as TUS_EVENTS,
  Upload as TusUpload,
} from "@tus/server";
import { S3Store as TusS3Store } from "@tus/s3-store";
import { FileStore as TusFileStore } from "@tus/file-store";
import _ from "lodash";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  getS3PresignedUrl,
  toStringValues,
  pathJoin,
  getObjectStoreS3Config,
  reqUseReplica,
  isValidBase64,
  mapInputCreatorId,
} from "./helpers";
import { db } from "../store";
import sql from "sql-template-strings";
import {
  ForbiddenError,
  UnprocessableEntityError,
  NotFoundError,
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  NotImplementedError,
} from "../store/errors";
import httpProxy from "http-proxy";
import { generateUniquePlaybackId } from "./generate-keys";
import {
  Asset,
  AssetPatchPayload,
  ExportTaskParams,
  IpfsFileInfo,
  NewAssetPayload,
  ObjectStore,
  PlaybackPolicy,
  Task,
} from "../schema/types";
import { WithID } from "../store/types";
import Queue from "../store/queue";
import { taskScheduler, ensureQueueCapacity } from "../task/scheduler";
import os from "os";
import {
  ensureExperimentSubject,
  isExperimentSubject,
} from "../store/experiment-table";
import { CliArgs } from "../parse-cli";
import mung from "express-mung";

const app = Router();

export function catalystPipelineStrategy(req: Request) {
  let { catalystPipelineStrategy } = req.body as NewAssetPayload;
  if (!req.user.admin && !req.user.isTestUser) {
    catalystPipelineStrategy = undefined;
  }
  return catalystPipelineStrategy;
}

function isPrivatePlaybackPolicy(playbackPolicy: PlaybackPolicy) {
  if (!playbackPolicy) {
    return false;
  }
  if (playbackPolicy.type === "public") {
    return false;
  }
  return true;
}

const secondaryStorageExperiment = "secondary-vod-storage";

async function defaultObjectStoreId(
  { config, body, user }: Request,
  isOldPipeline?: boolean
): Promise<string> {
  if (isOldPipeline) {
    return config.vodObjectStoreId;
  }

  if (isPrivatePlaybackPolicy(body.playbackPolicy)) {
    return config.vodCatalystPrivateAssetsObjectStoreId;
  }

  const secondaryStorageEnabled = await isExperimentSubject(
    secondaryStorageExperiment,
    user.id
  );
  const secondaryObjectStoreId =
    secondaryStorageEnabled && config.secondaryVodObjectStoreId;
  return (
    secondaryObjectStoreId ||
    config.vodCatalystObjectStoreId ||
    config.vodObjectStoreId
  );
}

export function assetEncryptionWithoutKey(
  encryption: NewAssetPayload["encryption"]
) {
  if (!encryption) {
    return encryption;
  }
  return {
    ...encryption,
    key: "***",
  };
}

function cleanAssetTracks(asset: WithID<Asset>) {
  return !asset.videoSpec
    ? asset
    : {
        ...asset,
        videoSpec: {
          ...asset.videoSpec,
          tracks: undefined,
        },
      };
}

function anyMatchesRegexOrPrefix(
  arr: (string | RegExp)[],
  value: string
): boolean {
  for (const item of arr) {
    if (item instanceof RegExp && item.test(value)) {
      return true;
    }
    if (typeof item === "string" && value.startsWith(item)) {
      return true;
    }
  }
  return false;
}

function parseUrlToDStorageUrl(
  url: string,
  { trustedIpfsGateways, trustedArweaveGateways }: CliArgs
): string {
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  let pathElements = path.split("/");
  if (pathElements.length > 0 && pathElements[0] === "") {
    pathElements = pathElements.slice(1);
  }

  const isIpfs = pathElements.length >= 2 && pathElements[0] === "ipfs";
  if (isIpfs) {
    const isTrusted = anyMatchesRegexOrPrefix(trustedIpfsGateways, url);
    if (!isTrusted) {
      return null;
    }

    const cidPath = pathElements.slice(1).join("/");
    return `ipfs://${cidPath}`;
  }

  const isArweave =
    pathElements.length >= 1 &&
    anyMatchesRegexOrPrefix(trustedArweaveGateways, url);
  if (isArweave) {
    const txIdPath = pathElements.join("/");
    return `ar://${txIdPath}`;
  }

  return null;
}

export async function validateAssetPayload(
  id: string,
  playbackId: string,
  userId: string,
  createdAt: number,
  defaultObjectStoreId: string,
  config: CliArgs,
  payload: NewAssetPayload,
  source: Asset["source"]
): Promise<WithID<Asset>> {
  if (payload.objectStoreId) {
    const os = await getActiveObjectStore(payload.objectStoreId);
    if (os.userId !== userId) {
      throw new ForbiddenError(
        `the provided object store is not owned by user`
      );
    }
  }

  // Validate playbackPolicy on creation to generate resourceId & check if unifiedAccessControlConditions is present when using lit_signing_condition
  const playbackPolicy = await validateAssetPlaybackPolicy(
    payload,
    playbackId,
    userId,
    createdAt
  );

  // Transform IPFS and Arweave gateway URLs into native protocol URLs
  if (source.type === "url") {
    const dStorageUrl = parseUrlToDStorageUrl(source.url, config);

    if (dStorageUrl) {
      source = {
        type: "url",
        url: dStorageUrl,
        gatewayUrl: source.url,
      };
    }
  }

  return {
    id,
    playbackId,
    userId,
    createdAt,
    status: {
      phase: source.type === "directUpload" ? "uploading" : "waiting",
      updatedAt: createdAt,
    },
    name: payload.name,
    source,
    staticMp4: payload.staticMp4,
    creatorId: mapInputCreatorId(payload.creatorId),
    playbackPolicy,
    objectStoreId: payload.objectStoreId || defaultObjectStoreId,
    storage: storageInputToState(payload.storage),
  };
}

async function validateAssetPlaybackPolicy(
  { playbackPolicy, objectStoreId, encryption }: Partial<NewAssetPayload>,
  playbackId: string,
  userId: string,
  createdAt: number
) {
  if (isPrivatePlaybackPolicy(playbackPolicy) && objectStoreId) {
    throw new ForbiddenError(`private assets cannot use custom object store`);
  }

  if (playbackPolicy?.type === "lit_signing_condition") {
    await ensureExperimentSubject("lit-signing-condition", userId);

    if (!playbackPolicy.unifiedAccessControlConditions) {
      throw new UnprocessableEntityError(
        `playbackPolicy.unifiedAccessControlConditions is required when using lit_signing_condition`
      );
    }
    if (!playbackPolicy?.resourceId) {
      playbackPolicy.resourceId = {
        baseUrl: "playback.livepeer.studio",
        path: `/gate/${playbackId}`,
        orgId: "livepeer",
        role: "",
        extraData: `createdAt=${createdAt}`,
      };
    }
  }
  if (playbackPolicy?.type === "webhook") {
    let webhook = await db.webhook.get(playbackPolicy.webhookId);
    if (!webhook || webhook.deleted) {
      throw new BadRequestError(
        `webhook ${playbackPolicy.webhookId} not found`
      );
    }
    if (webhook.userId !== userId) {
      throw new BadRequestError(
        `webhook ${playbackPolicy.webhookId} not found`
      );
    }
  }
  if (encryption?.encryptedKey) {
    if (!playbackPolicy) {
      throw new BadRequestError(
        `a playbackPolicy is required when using encryption`
      );
    }
  }
  return playbackPolicy;
}

async function getActiveObjectStore(id: string) {
  const os = await db.objectStore.get(id);
  if (!os || os.deleted || os.disabled) {
    throw new Error("Object store not found or disabled");
  }
  return os;
}

export type StaticPlaybackInfo = {
  playbackUrl: string;
  size: number;
  height: number;
  width: number;
  bitrate: number;
};

export function getStaticPlaybackInfo(
  asset: WithID<Asset>,
  os: ObjectStore
): StaticPlaybackInfo[] {
  return (asset.files ?? [])
    .filter((f) => f.type === "static_transcoded_mp4")
    .map((f) => ({
      playbackUrl: pathJoin(os.publicUrl, asset.playbackId, f.path),
      size: f.spec?.size,
      height: f.spec?.height,
      width: f.spec?.width,
      bitrate: f.spec?.bitrate,
    }))
    .sort((a, b) => b.bitrate - a.bitrate);
}

export function getPlaybackUrl(
  ingest: string,
  asset: WithID<Asset>,
  os: ObjectStore
): string {
  if (asset.playbackRecordingId) {
    return pathJoin(
      ingest,
      "recordings",
      asset.playbackRecordingId,
      "index.m3u8"
    );
  }
  const catalystManifest = asset.files?.find(
    (f) => f.type === "catalyst_hls_manifest"
  );
  if (catalystManifest) {
    return pathJoin(os.publicUrl, asset.playbackId, catalystManifest.path);
  }
  return undefined;
}

function getDownloadUrl(
  { vodObjectStoreId }: Request["config"],
  ingest: string,
  asset: WithID<Asset>,
  os: ObjectStore
): string {
  if (asset.source?.type === "recording" && !asset.playbackRecordingId) {
    // Recording V2
    const staticPlaybackInfos = getStaticPlaybackInfo(asset, os);
    if (staticPlaybackInfos.length > 0) {
      return staticPlaybackInfos[0].playbackUrl;
    }
  }

  const base =
    os.id !== vodObjectStoreId ? os.publicUrl : pathJoin(ingest, "asset");
  const source = asset.files?.find((f) => f.type === "source_file");
  if (source) {
    return pathJoin(base, asset.playbackId, source.path);
  }
  return pathJoin(base, asset.playbackId, "video");
}

export async function withPlaybackUrls(
  config: CliArgs,
  ingest: string,
  asset: WithID<Asset>,
  os?: ObjectStore
): Promise<WithID<Asset>> {
  if (asset.files?.length < 1) {
    // files is only set when playback is available
    return asset;
  }
  try {
    os = os || (await getActiveObjectStore(asset.objectStoreId));
  } catch (err) {
    console.error("Error getting asset object store", err);
    return asset;
  }
  return {
    ...asset,
    ...(asset.status.phase === "ready" && {
      downloadUrl: getDownloadUrl(config, ingest, asset, os),
    }),
    playbackUrl: getPlaybackUrl(ingest, asset, os),
  };
}

export function withIpfsUrls<T extends Partial<IpfsFileInfo>>(
  gatewayUrl: string,
  ipfs: T
): T {
  if (!ipfs?.cid) {
    return ipfs;
  }
  return {
    ...ipfs,
    url: `ipfs://${ipfs.cid}`,
    gatewayUrl: pathJoin(gatewayUrl, ipfs.cid),
  };
}

function assetWithIpfsUrls(
  gatewayUrl: string,
  asset: WithID<Asset>
): WithID<Asset> {
  if (!asset?.storage?.ipfs?.cid) {
    return asset;
  }
  return _.merge({}, asset, {
    storage: {
      ipfs: {
        ...withIpfsUrls(gatewayUrl, asset.storage.ipfs),
        nftMetadata: withIpfsUrls(gatewayUrl, asset.storage.ipfs.nftMetadata),
      },
    },
  });
}

function storageInputToState(
  input: NewAssetPayload["storage"]
): Asset["storage"] {
  if (typeof input?.ipfs === "undefined") {
    return undefined;
  }

  let { ipfs } = input;
  if (typeof ipfs === "boolean" || !ipfs) {
    ipfs = { spec: ipfs ? {} : null };
  } else if (typeof ipfs.spec === "undefined") {
    ipfs = { spec: {} };
  }
  return { ...input, ipfs };
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
  { taskScheduler, config }: Request,
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
      await ensureQueueCapacity(config, asset.userId);

      task = await taskScheduler.createAndScheduleTask(
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
      status: {
        phase: "waiting",
        tasks: {
          ...storage?.status?.tasks,
          pending: task.id,
        },
      },
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
  const uploadedObjectKey = `directUpload/${playbackId}`;
  const os = await getActiveObjectStore(objectStoreId);

  const presignedUrl = await getS3PresignedUrl(os, uploadedObjectKey);
  const uploadToken = jwt.sign({ playbackId, presignedUrl, aud }, jwtSecret, {
    algorithm: "HS256",
  });

  const osPublicUrl = new URL(os.publicUrl);
  osPublicUrl.pathname = pathJoin(osPublicUrl.pathname, uploadedObjectKey);
  const downloadUrl = osPublicUrl.toString();

  return { uploadedObjectKey, uploadToken, downloadUrl };
}

function parseUploadUrl(
  signedUploadUrl: string,
  jwtSecret: string,
  audience: string
) {
  let urlJwt: JwtPayload;
  let uploadUrl: string;
  try {
    urlJwt = jwt.verify(signedUploadUrl, jwtSecret, {
      audience,
    }) as JwtPayload;
    uploadUrl = urlJwt.presignedUrl;
  } catch (err) {
    throw new ForbiddenError(`Invalid signed upload URL: ${err}`);
  }
  const { playbackId } = urlJwt;
  return { playbackId, uploadUrl };
}

export async function toExternalAsset(
  a: WithID<Asset>,
  config: CliArgs,
  details = false,
  isAdmin = false
) {
  const { ipfsGatewayUrl, ingest: ingestsConfig } = config;
  // Not sure why the ingests config was originally made an array and not a
  // single object, but we always configure it as a single element array on
  // deployments. So we always grab only the first element here.
  const ingest = ingestsConfig[0]?.base;

  a = await withPlaybackUrls(config, ingest, a);
  a = assetWithIpfsUrls(ipfsGatewayUrl, a);
  if (isAdmin) {
    return a;
  }
  a = db.asset.cleanWriteOnlyResponse(a) as WithID<Asset>;
  if (!details) {
    a = cleanAssetTracks(a);
  }

  return a;
}

app.use(
  mung.jsonAsync(async function cleanWriteOnlyResponses(
    data: WithID<Asset>[] | WithID<Asset> | { asset: WithID<Asset> },
    req
  ) {
    const { details } = toStringValues(req.query);
    const toExternalAssetFunc = (a: Asset) =>
      toExternalAsset(a, req.config, !!details, req.user.admin);

    if (Array.isArray(data)) {
      return Promise.all(data.map(toExternalAssetFunc));
    }
    if ("id" in data) {
      return toExternalAssetFunc(data);
    }
    if ("asset" in data) {
      return {
        ...data,
        asset: await toExternalAssetFunc(data.asset),
      };
    }
    return data;
  })
);

const fieldsMap = {
  id: `asset.ID`,
  name: { val: `asset.data->>'name'`, type: "full-text" },
  objectStoreId: `asset.data->>'objectStoreId'`,
  createdAt: { val: `asset.data->'createdAt'`, type: "int" },
  updatedAt: { val: `asset.data->'status'->'updatedAt'`, type: "int" },
  userId: `asset.data->>'userId'`,
  playbackId: `asset.data->>'playbackId'`,
  playbackRecordingId: `asset.data->>'playbackRecordingId'`,
  phase: `asset.data->'status'->>'phase'`,
  "user.email": { val: `users.data->>'email'`, type: "full-text" },
  cid: `asset.data->'storage'->'ipfs'->>'cid'`,
  nftMetadataCid: `asset.data->'storage'->'ipfs'->'nftMetadata'->>'cid'`,
  sourceUrl: `asset.data->'source'->>'url'`,
} as const;

app.get("/", authorizer({}), async (req, res) => {
  let { limit, cursor, all, allUsers, order, filters, count, cid, ...otherQs } =
    toStringValues(req.query);
  const fieldFilters = _(otherQs)
    .pick("playbackId", "sourceUrl", "phase")
    .map((v, k) => ({ id: k, value: decodeURIComponent(v) }))
    .value();
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  const query = [
    ...parseFilters(fieldsMap, filters),
    ...parseFilters(fieldsMap, JSON.stringify(fieldFilters)),
  ];

  if (cid) {
    const ipfsUrl = `ipfs://${cid}`;
    query.push(
      sql`(asset.data->'storage'->'ipfs'->>'cid' = ${cid} OR asset.data->'source'->>'url' = ${ipfsUrl})`
    );
  }

  if (!req.user.admin || !all || all === "false") {
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
  const asset = await db.asset.get(req.params.id, {
    useReplica: reqUseReplica(req),
  });
  if (!asset || asset.deleted) {
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

    await ensureQueueCapacity(req.config, req.user.id);

    const params = req.body as ExportTaskParams;
    const task = await req.taskScheduler.createAndScheduleTask(
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

const uploadWithUrlHandler: RequestHandler = async (req, res) => {
  let { url, encryption } = req.body as NewAssetPayload;
  if (!url) {
    return res.status(422).json({
      errors: [`Must provide a "url" field for the asset contents`],
    });
  }
  if (encryption) {
    if (encryption.encryptedKey) {
      if (!isValidBase64(encryption.encryptedKey)) {
        return res.status(422).json({
          errors: [`"encryptedKey" must be valid base64`],
        });
      }
    }
  }

  const id = uuid();
  const playbackId = await generateUniquePlaybackId(id);
  const newAsset = await validateAssetPayload(
    id,
    playbackId,
    req.user.id,
    Date.now(),
    await defaultObjectStoreId(req),
    req.config,
    req.body,
    { type: "url", url, encryption: assetEncryptionWithoutKey(encryption) }
  );
  const dupAsset = await db.asset.findDuplicateUrlUpload(url, req.user.id);
  if (dupAsset) {
    const [task] = await db.task.find({ outputAssetId: dupAsset.id });
    if (!task.length) {
      console.error("Found asset with no task", dupAsset);
      // proceed as a regular new asset
    } else {
      // return the existing asset and task, as if created now, with a slightly
      // different status code (200, not 201). Should be transparent to clients.
      res.status(200).json({ asset: dupAsset, task: { id: task[0].id } });
      return;
    }
  }

  await ensureQueueCapacity(req.config, req.user.id);

  const asset = await createAsset(newAsset, req.queue);
  const task = await req.taskScheduler.createAndScheduleTask(
    "upload",
    {
      upload: {
        url,
        catalystPipelineStrategy: catalystPipelineStrategy(req),
        encryption,
      },
    },
    undefined,
    asset
  );

  res.status(201);
  res.json({ asset, task: { id: task.id } });
};

app.post(
  "/upload/url",
  authorizer({}),
  validatePost("new-asset-payload"),
  uploadWithUrlHandler
);
// TODO: Remove this at some point. Registered only for backward compatibility.
app.post(
  "/import",
  authorizer({}),
  validatePost("new-asset-payload"),
  uploadWithUrlHandler
);

app.post(
  "/request-upload",
  authorizer({}),
  validatePost("new-asset-payload"),
  async (req, res) => {
    const id = uuid();
    let playbackId = await generateUniquePlaybackId(id);

    const { vodObjectStoreId, jwtSecret, jwtAudience } = req.config;
    const { encryption } = req.body as NewAssetPayload;
    if (encryption) {
      if (encryption.encryptedKey) {
        if (!isValidBase64(encryption.encryptedKey)) {
          return res.status(422).json({
            errors: [`encryptedKey must be valid base64`],
          });
        }
      }
    }

    let asset = await validateAssetPayload(
      id,
      playbackId,
      req.user.id,
      Date.now(),
      await defaultObjectStoreId(req),
      req.config,
      req.body,
      {
        type: "directUpload",
        encryption: assetEncryptionWithoutKey(encryption),
      }
    );

    const { uploadToken, downloadUrl } = await genUploadUrl(
      playbackId,
      vodObjectStoreId,
      jwtSecret,
      jwtAudience
    );

    const ingests = await req.getIngest();
    if (!ingests.length) {
      res.status(501);
      return res.json({ errors: ["Ingest not configured"] });
    }
    const baseUrl = ingests[0].origin;
    const url = `${baseUrl}/api/asset/upload/direct?token=${uploadToken}`;
    const tusEndpoint = `${baseUrl}/api/asset/upload/tus?token=${uploadToken}`;

    // we check for enqueued tasks when starting an upload, but uploads
    // themselves don't count towards the limit. this should be relatvely fine
    // as direct uploads will also need a lot of effort from callers to upload
    // the files, so the risk is much smaller.
    await ensureQueueCapacity(req.config, req.user.id);
    asset = await createAsset(asset, req.queue);

    const task = await req.taskScheduler.createTask(
      "upload",
      {
        upload: {
          url: downloadUrl,
          catalystPipelineStrategy: catalystPipelineStrategy(req),
          encryption,
        },
      },
      null,
      asset
    );

    res.json({ url, tusEndpoint, asset, task: { id: task.id } });
  }
);

let tusServer: TusServer;

export const setupTus = async (objectStoreId: string): Promise<void> => {
  tusServer = await createTusServer(objectStoreId);
};

async function createTusServer(objectStoreId: string) {
  const os = await getActiveObjectStore(objectStoreId);
  const s3config = await getObjectStoreS3Config(os);
  const datastore = new TusS3Store({
    partSize: 8 * 1024 * 1024,
    s3ClientConfig: s3config,
  });
  const tusServer = new TusServer({
    datastore,
    path: "/upload/tus",
    namingFunction,
    respectForwardedHeaders: true,
  });
  tusServer.on(TUS_EVENTS.POST_FINISH, onTusUploadComplete(false));
  return tusServer;
}

export const setupTestTus = async (): Promise<void> => {
  tusServer = await createTestTusServer();
};

async function createTestTusServer() {
  const datastore = new TusFileStore({
    directory: os.tmpdir(),
  });
  const tusTestServer = new TusServer({
    datastore: datastore,
    path: "/upload/tus",
    namingFunction: (req: Request) =>
      req.res.getHeader("livepeer-playback-id").toString(),
    respectForwardedHeaders: true,
  });

  tusTestServer.on(TUS_EVENTS.POST_FINISH, onTusUploadComplete(true));
  return tusTestServer;
}

const namingFunction = (req: Request) => {
  const playbackId = req.res.getHeader("livepeer-playback-id").toString();
  if (!playbackId) {
    throw new InternalServerError("Missing playbackId in response headers");
  }
  return `directUpload/${playbackId}`;
};

const onTusUploadComplete =
  (isTest: boolean) => async (req: Request, res: Response, file: TusUpload) => {
    const playbackId = isTest ? file.id : file.id.split("/")[1]; // `directUpload/${playbackId}`
    await onUploadComplete(playbackId);
  };

const onUploadComplete = async (playbackId: string) => {
  try {
    const { task, asset } = await getPendingAssetAndTask(playbackId);
    await taskScheduler.scheduleTask(task);
    await db.asset.update(asset.id, {
      status: {
        phase: "waiting",
        updatedAt: Date.now(),
      },
    });
  } catch (err) {
    console.error(
      `error processing upload complete playbackId=${playbackId} err=`,
      err
    );
  }
};

const getPendingAssetAndTask = async (playbackId: string) => {
  const asset = await db.asset.getByPlaybackId(playbackId, {
    useReplica: false,
  });
  if (!asset) {
    throw new NotFoundError(`asset not found`);
  } else if (asset.status.phase !== "uploading") {
    throw new UnprocessableEntityError(`asset has already been uploaded`);
  }

  const tasks = await db.task.find(
    { outputAssetId: asset.id },
    { useReplica: false }
  );
  if (!tasks?.length || !tasks[0]?.length) {
    throw new NotFoundError(`task not found`);
  }
  const task = tasks[0][0];
  if (task.status?.phase !== "pending") {
    throw new UnprocessableEntityError(`asset has already been uploaded`);
  }
  return { asset, task };
};

app.use("/upload/tus/*", async (req, res, next) => {
  if (!tusServer) {
    throw new NotImplementedError("Tus server not configured");
  }
  return next();
});

app.post("/upload/tus", async (req, res) => {
  const uploadToken = req.query.token?.toString();
  if (!uploadToken) {
    throw new UnauthorizedError(
      "Missing uploadToken metadata from /request-upload API"
    );
  }

  const { jwtSecret, jwtAudience } = req.config;
  const { playbackId } = parseUploadUrl(uploadToken, jwtSecret, jwtAudience);
  await getPendingAssetAndTask(playbackId);
  // TODO: Consider updating asset name from metadata?
  res.setHeader("livepeer-playback-id", playbackId);
  return tusServer.handle(req, res);
});

app.all("/upload/tus/*", (req, res) => {
  return tusServer.handle(req, res);
});

app.put("/upload/direct", async (req, res) => {
  const {
    query: { token },
    config: { jwtSecret, jwtAudience },
  } = req;
  const { uploadUrl, playbackId } = parseUploadUrl(
    token?.toString(),
    jwtSecret,
    jwtAudience
  );

  // ensure upload exists and is pending
  await getPendingAssetAndTask(playbackId);

  var proxy = httpProxy.createProxyServer({});
  proxy.on("end", async function (proxyReq, _, res) {
    if (res.statusCode == 200) {
      // TODO: Find a way to return the task in the response
      await onUploadComplete(playbackId);
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
  await req.taskScheduler.deleteAsset(asset);
  res.status(204);
  res.end();
});

app.patch(
  "/:id",
  authorizer({}),
  validatePost("asset-patch-payload"),
  async (req, res) => {
    // these are the only updateable fields
    let {
      name,
      playbackPolicy,
      storage: storageInput,
      creatorId,
    } = req.body as AssetPatchPayload;

    // update a specific asset
    const { id } = req.params;
    const asset = await db.asset.get(id);
    if (!asset || (asset.userId !== req.user.id && !req.user.admin)) {
      throw new NotFoundError(`asset not found`);
    } else if (asset.status.phase !== "ready") {
      throw new UnprocessableEntityError(`asset is not ready`);
    }

    let storage = storageInputToState(storageInput);
    if (storage) {
      storage = await reconcileAssetStorage(req, asset, storage);
    }

    if (
      playbackPolicy &&
      asset.playbackPolicy?.type === "lit_signing_condition"
    ) {
      const sameResourceId = _.isEqual(
        playbackPolicy.resourceId,
        asset.playbackPolicy.resourceId
      );
      if (playbackPolicy.type !== "lit_signing_condition" || !sameResourceId) {
        throw new UnprocessableEntityError(
          `cannot update playback policy from lit_signing_condition nor change the resource ID`
        );
      }
    }

    if (playbackPolicy) {
      if (
        isPrivatePlaybackPolicy(playbackPolicy) !==
        isPrivatePlaybackPolicy(asset.playbackPolicy)
      ) {
        throw new UnprocessableEntityError(
          `cannot update playback policy from private to public or vice versa`
        );
      }

      playbackPolicy = await validateAssetPlaybackPolicy(
        { playbackPolicy },
        asset.playbackId,
        asset.userId,
        asset.createdAt
      );
    }

    await req.taskScheduler.updateAsset(asset, {
      name,
      storage,
      playbackPolicy,
      creatorId: mapInputCreatorId(creatorId),
    });
    const updated = await db.asset.get(id, { useReplica: false });
    res.status(200).json(updated);
  }
);

// TODO: create migration API to parse and migrate gateway URL of existing
// assets in the DB.

app.post(
  "/migrate/dstorage-urls",
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    // parse limit from querystring
    const limit = parseInt(req.query.limit?.toString() || "1000");
    const urlPrefix = req.query.urlPrefix?.toString() || "https://arweave.net/";
    const urlLike = req.query.urlLike?.toString() || urlPrefix + "%";
    const from = req.query.from?.toString();

    const [assets] = await db.asset.find(
      [
        sql`data->'source'->>'url' LIKE ${urlLike}`,
        ...(!from ? [] : [sql`data->'source'->>'url' > ${from}`]),
      ],
      { limit, order: parseOrder(fieldsMap, "sourceUrl-false") }
    );

    let tasks: Promise<WithID<Asset>>[] = [];
    let results: WithID<Asset>[] = [];
    let last: string;
    for (const asset of assets) {
      if (asset.source.type !== "url") {
        continue;
      }

      // Transform IPFS and Arweave gateway URLs into native protocol URLs
      const url = (last = asset.source.url);
      const dStorageUrl = parseUrlToDStorageUrl(url, req.config);

      if (dStorageUrl) {
        const source = {
          type: "url",
          url: dStorageUrl,
          gatewayUrl: url,
        } as const;

        tasks.push(
          db.asset
            .update(asset.id, { source })
            .then(() => db.asset.get(asset.id))
        );
      }

      if (tasks.length >= 3) {
        results = results.concat(await Promise.all(tasks));
        tasks = [];
      }
    }
    if (tasks.length > 0) {
      results = results.concat(await Promise.all(tasks));
    }

    res.status(200).json({
      migrated: results.length,
      total: assets.length,
      last,
      assets: results.map(({ id, playbackId, source }) => ({
        id,
        playbackId,
        source,
      })),
    });
  }
);

export default app;
