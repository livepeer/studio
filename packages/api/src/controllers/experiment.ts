import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../store/errors";
import { toStringValues } from "./helpers";
import { User } from "../schema/types";
import { authorizer } from "../middleware";

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

  const { experiment } = req.params;
  let userExperiments = user.experiments || {};
  if (!userExperiments[experiment]) {
    throw new ForbiddenError("user not in experiment");
  }
  res.status(204).end();
});

app.post("/gatekeep", authorizer({ anyAdmin: true }), async (req, res) => {
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

  const { experiment } = req.params;
  let userExperiments = user.experiments || {};
  if (!userExperiments[experiment]) {
    throw new ForbiddenError("user not in experiment");
  }
  res.status(204).end();
});

export default app;
