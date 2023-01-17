import { Router } from "express";
import _ from "lodash";
import { v4 as uuid, validate as validateUuid } from "uuid";
import { db } from "../store";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../store/errors";
import {
  makeNextHREF,
  parseFilters,
  parseOrder,
  toStringValues,
} from "./helpers";
import sql from "sql-template-strings";
import { Experiment, ExperimentAudiencePayload, User } from "../schema/types";
import { authorizer, validatePost } from "../middleware";
import { WithID } from "../store/types";

import experimentApis from "./experiment/index";
import { isExperimentSubject } from "../store/experiment-table";

async function toUserId(emailOrId: string) {
  let user: User;
  if (validateUuid(emailOrId)) {
    user = await db.user.get(emailOrId);
  } else {
    const [users] = await db.user.find({ email: emailOrId });
    user = users?.[0];
  }
  if (!user) {
    throw new NotFoundError(`user not found: ${emailOrId}`);
  }
  return user.id;
}

const toUserIds = (emailsOrIds: string[]) =>
  Promise.all(emailsOrIds.map(toUserId));

const app = Router();

const experimentSubjectsOnly =
  (experiment: string) => async (req, res, next) => {
    const isSubject = await isExperimentSubject(experiment, req.user?.id);
    if (!isSubject) {
      throw new ForbiddenError("user is not an experiment subject");
    }
    next();
  };

for (const [experiment, api] of Object.entries(experimentApis)) {
  app.use(`/api/${experiment}`, experimentSubjectsOnly(experiment), api);
}

app.get("/check/:experiment", async (req, res) => {
  let user: User;
  if (req.user) {
    user = req.user;
  } else {
    let { userId, playbackId } = toStringValues(req.query);
    if (!userId) {
      if (!playbackId) {
        throw new BadRequestError(
          "must be authenticated or provide userId or playbackId"
        );
      }
      const content =
        (await db.asset.getByPlaybackId(playbackId)) ||
        (await db.stream.getByPlaybackId(playbackId));
      if (!content) {
        throw new NotFoundError("content not found");
      }
      userId = content.userId;
    }
    user = await db.user.get(userId);
    if (!user || user.suspended) {
      throw new NotFoundError("user not found or suspended");
    }
  }

  const { experiment: experimentQuery } = req.params;
  const isSubject = await isExperimentSubject(experimentQuery, user.id);
  if (!isSubject) {
    throw new ForbiddenError("user is not an experiment subject");
  }
  res.status(204).end();
});

app.post(
  "/:experiment/audience",
  authorizer({ anyAdmin: true }),
  validatePost("experiment-audience-payload"),
  async (req, res) => {
    const { experiment: experimentQuery } = req.params;
    const { addUsers, removeUsers } = req.body as ExperimentAudiencePayload;

    const [experiment, addUserIds, removeUserIds] = await Promise.all([
      db.experiment.getByNameOrId(experimentQuery),
      toUserIds(addUsers),
      toUserIds(removeUsers),
    ]);
    const audienceUserIds = _(experiment.audienceUserIds ?? [])
      .concat(addUserIds)
      .difference(removeUserIds)
      .uniq()
      .value();

    await db.experiment.update(experiment.id, {
      updatedAt: Date.now(),
      audienceUserIds,
    });

    res.status(204).end();
  }
);

// Experiment CRUD

app.post(
  "/",
  authorizer({ anyAdmin: true }),
  validatePost("experiment"),
  async (req, res) => {
    let { name, audienceUserIds } = req.body as Experiment;
    audienceUserIds = await toUserIds(audienceUserIds);

    const experiment = await db.experiment.create({
      id: uuid(),
      name,
      userId: req.user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      audienceUserIds,
    });
    res.status(201).json(experiment);
  }
);

app.patch("/:experiment", authorizer({ anyAdmin: true }), async (req, res) => {
  const { experiment: experimentQuery } = req.params;
  let { audienceUserIds } = req.body as { audienceUserIds: string[] };
  if (
    !Array.isArray(audienceUserIds) ||
    audienceUserIds.some((s) => typeof s !== "string")
  ) {
    throw new BadRequestError("userIds must be an array of strings");
  }

  const experiment = await db.experiment.getByNameOrId(experimentQuery);
  audienceUserIds = await toUserIds(audienceUserIds);

  await db.experiment.update(experiment.id, {
    updatedAt: Date.now(),
    audienceUserIds,
  });

  res.status(204).end();
});

app.get("/:experiment", authorizer({ anyAdmin: true }), async (req, res) => {
  let experiment = await db.experiment.getByNameOrId(req.params.experiment);

  experiment = {
    ...experiment,
    audienceUsers: await Promise.all(
      experiment.audienceUserIds.map(async (userId) => {
        const user = await db.user.get(userId);
        return db.user.cleanWriteOnlyResponse(user);
      })
    ),
  };

  res.status(200).json(experiment);
});

const fieldsMap = {
  id: `experiment.ID`,
  name: { val: `experiment.data->>'name'`, type: "full-text" },
  createdAt: { val: `experiment.data->'createdAt'`, type: "int" },
  updatedAt: { val: `experiment.data->'status'->'updatedAt'`, type: "int" },
  userId: `experiment.data->>'userId'`,
} as const;

app.get("/", authorizer({ anyAdmin: true }), async (req, res) => {
  let { limit, cursor, order, filters, count, subject } = toStringValues(
    req.query
  );
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  if (!order) {
    order = "updatedAt-true,createdAt-true";
  }

  // as this is an admin-only API, the query is always cross-user
  const query = parseFilters(fieldsMap, filters);
  if (subject) {
    const subjectUserId = await toUserId(subject);
    query.push(sql`experiment.data->>'audienceUserId' @> ${subjectUserId}`);
  }

  let output: WithID<Experiment>[];
  let newCursor: string;

  let fields = " experiment.id as id, experiment.data as data";
  if (count) {
    fields = fields + ", count(*) OVER() AS count";
  }
  [output, newCursor] = await db.experiment.find(query, {
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
