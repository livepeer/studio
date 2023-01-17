import { Router } from "express";
import _ from "lodash";
import { v4 as uuid } from "uuid";
import { db } from "../store";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../store/errors";
import { toStringValues } from "./helpers";
import { Experiment, ExperimentAudiencePayload, User } from "../schema/types";
import { authorizer, validatePost } from "../middleware";

async function toUserIds(emailOrIds: string[]) {
  return Promise.all(
    emailOrIds?.map(async (emailOrId) => {
      let user = await db.user.get(emailOrId);
      if (!user) {
        const [users] = await db.user.find({ email: emailOrId });
        if (users?.length === 0) {
          throw new NotFoundError("user not found: " + emailOrId);
        }
        user = users[0];
      }
      return user.id;
    })
  );
}

const app = Router();

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
  const experiment = await db.experiment.getByNameOrId(experimentQuery);
  if (!experiment.audienceUserIds?.includes(user.id)) {
    throw new ForbiddenError("user not in experiment");
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

    await db.experiment.update(experiment.id, { audienceUserIds });

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

  await db.experiment.update(experiment.id, { audienceUserIds });

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

app.get("/user/:id", authorizer({ anyAdmin: true }), async (req, res) => {
  const user = await db.user.get(req.params.id);
  if (!user) {
    throw new NotFoundError("user not found");
  }

  const experiments = await db.experiment.listUserExperiments(user.id);
  res.status(200).json({
    experiments: experiments.data.map((x) => x.name),
  });
});

export default app;
