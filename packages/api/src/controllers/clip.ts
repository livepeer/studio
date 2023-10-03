import { validatePost } from "../middleware";
import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import { ForbiddenError, NotFoundError } from "../store/errors";
import {
  createAsset,
  validateAssetPayload,
  defaultObjectStoreId,
  catalystPipelineStrategy,
} from "./asset";
import { generateUniquePlaybackId } from "./generate-keys";
import { v4 as uuid } from "uuid";
import { DBSession } from "../store/session-table";
import { authorizer } from "../middleware";
import { toExternalAsset } from "./asset";
import mung from "express-mung";
import { Asset } from "../schema/types";
import { WithID } from "../store/types";
import { getRunningRecording } from "./session";
import {
  toStringValues,
  parseFilters,
  parseOrder,
  makeNextHREF,
} from "./helpers";
import sql from "sql-template-strings";

const app = Router();
const LVPR_SDK_EMAILS = ["livepeerjs@livepeer.org", "chase@livepeer.org"];

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

app.post("/", validatePost("clip-payload"), async (req, res) => {
  const playbackId = req.body.playbackId;
  const clippingUser = req.user;

  const id = uuid();
  let uPlaybackId = await generateUniquePlaybackId(id);

  const content = await db.stream.getByPlaybackId(playbackId); //||
  //(await db.asset.getByPlaybackId(playbackId));

  let isStream: boolean;
  if (content && "streamKey" in content) {
    isStream = true;
  }

  if (!content) {
    throw new NotFoundError("Content not found");
  }

  const owner = await db.user.get(content.userId);

  if (!owner) {
    throw new NotFoundError(
      "Content not found - unable to find owner of content"
    );
  }

  // If the user is neither an admin, nor part of LVPR_SDK_EMAILS and doesn't own the content, throw an error.
  if (
    !clippingUser.admin &&
    !LVPR_SDK_EMAILS.includes(clippingUser.email) &&
    clippingUser.id !== owner.id
  ) {
    console.log(`
        clip: user=${clippingUser.email} does not have permission to clip stream=${content.id} - owner=${owner?.id}
      `);
    throw new ForbiddenError("You do not have permission to clip this stream");
  }

  if ("suspended" in content && content.suspended) {
    throw new NotFoundError("Content not found");
  }

  let url: string;
  let session: DBSession;
  let objectStoreId: string;

  if (isStream) {
    if (!content.record) {
      res.status(400).json({
        errors: ["Recording must be enabled on a live stream to create clips"],
      });
    }
    ({ url, session, objectStoreId } = await getRunningRecording(content, req));
  } else {
    res
      .status(400)
      .json({ errors: ["Clipping for assets is not implemented yet"] });
    return;
  }

  if (!session) {
    throw new Error("Recording session not found");
  }

  let asset = await validateAssetPayload(
    id,
    uPlaybackId,
    owner.id,
    Date.now(),
    await defaultObjectStoreId(req),
    req.config,
    {
      name: req.body.name || `clip-${uPlaybackId}`,
    },
    {
      type: "clip",
      ...(isStream ? { sessionId: session.id } : { assetId: content.id }),
    }
  );

  asset = await createAsset(asset, req.queue);

  const task = await req.taskScheduler.createAndScheduleTask(
    "clip",
    {
      clip: {
        clipStrategy: {
          playbackId,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        },
        catalystPipelineStrategy: catalystPipelineStrategy(req),
        url,
        sessionId: session.id,
        inputId: content.id,
        sourceObjectStoreId: objectStoreId,
      },
    },
    null,
    asset,
    owner.id
  );

  res.json({
    task: { id: task.id },
    asset,
  });
});

const fieldsMap = {
  id: `asset.ID`,
  createdAt: { val: `asset.data->'createdAt'`, type: "int" },
  updatedAt: { val: `asset.data->'status'->'updatedAt'`, type: "int" },
  userId: `asset.data->>'userId'`,
  playbackId: `asset.data->>'playbackId'`,
  sourceType: `asset.data->'source'->>'type'`,
  sourceSessionId: `asset.data->'source'->>'sessionId'`,
  sourceAssetId: `asset.data->'source'->>'assetId'`,
} as const;

app.get("/:id", authorizer({}), async (req, res) => {
  const { id } = req.params;

  let { limit, cursor, all, allUsers, order, filters, count, cid, ...otherQs } =
    toStringValues(req.query);

  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  const query = [...parseFilters(fieldsMap, filters)];

  if (!req.user.admin || !all || all === "false") {
    query.push(sql`asset.data->>'deleted' IS NULL`);
  }

  let output: WithID<Asset>[];
  let newCursor: string;

  query.push(sql`asset.data->>'userId' = ${req.user.id}`);

  const content =
    (await db.asset.getByPlaybackId(id)) ||
    (await db.session.get(id)) ||
    (await db.asset.get(id)) ||
    (await db.stream.getByIdOrPlaybackId(id));

  if (!content) {
    throw new NotFoundError("Content not found");
  }

  let contentType: string;

  if ("objectStoreId" in content) {
    contentType = "asset";
  } else if ("streamKey" in content) {
    contentType = "stream";
  } else {
    contentType = "session";
  }

  query.push(sql`asset.data->'source'->>'type' = 'clip'`);
  switch (contentType) {
    case "asset":
      query.push(sql`asset.data->'source'->>'assetId' = ${content.id}`);
      break;
    case "session":
      query.push(sql`asset.data->'source'->>'sessionId' = ${content.id}`);
      break;
    case "stream":
      const sessionQuery = [];
      sessionQuery.push(sql`data->>'parentId' = ${content.id}`);
      const [sessions] = await db.session.find(sessionQuery, {
        order: `data->>'lastSeen' DESC NULLS LAST`,
        cursor,
      });

      break;
  }

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

  res.status(200);
  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }

  return res.json(output);
});

export default app;
