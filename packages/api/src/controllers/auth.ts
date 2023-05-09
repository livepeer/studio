/**
 * Special controller for forwarding all incoming requests to a geolocated API region
 */

import { Request, Router } from "express";
import { authorizer } from "../middleware";
import { db } from "../store";
import { ForbiddenError, NotFoundError } from "../store/errors";
import Table from "../store/table";
import { getResourceByPlaybackId } from "./playback";

type UserOwnedObj = { id: string; deleted?: boolean; userId?: string };

// Grabs the ID from the provided request header, fetches the corresponding
// object in the database table and checks that it is owned by the user making
// the request. Throws a status code error if not.
async function checkUserOwned(
  req: Request,
  headerName: string,
  getter: (id: string) => Promise<UserOwnedObj>
) {
  if (!(headerName in req.headers)) {
    return;
  }
  const id = req.headers[headerName]?.toString();

  const obj = await getter(id);
  if (!obj || obj.deleted) {
    throw new NotFoundError(`failed to find object from ${headerName} header`);
  }

  const hasAccess = obj.userId === req.user.id || req.user.admin;
  if (!hasAccess) {
    throw new ForbiddenError(`access forbidden`);
  }

  return obj.userId;
}

function playbackIdGetter(req: Request) {
  return async (id: string): Promise<UserOwnedObj> => {
    const { asset, stream, session } = await getResourceByPlaybackId(
      id,
      req.user
    );
    return asset || stream || session;
  };
}

function tableGetter(table: Table<UserOwnedObj>) {
  return table.get.bind(table);
}

const app = Router();

app.all(
  "/",
  authorizer({ originalUriHeader: "x-original-uri" }),
  async (req, res) => {
    const userIds = await Promise.all([
      checkUserOwned(req, "x-livepeer-stream-id", tableGetter(db.stream)),
      checkUserOwned(req, "x-livepeer-asset-id", tableGetter(db.asset)),
      checkUserOwned(req, "x-livepeer-playback-id", playbackIdGetter(req)),
    ]);

    // use object user ID in case it is an admin trying to impersonate the user
    let userId = !req.user.admin
      ? req.user.id
      : userIds.find((id) => !!id) || req.user.id;
    res.header("x-livepeer-user-id", userId);

    res.status(204).end();
  }
);

export default app;
