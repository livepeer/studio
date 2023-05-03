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
  objectTypeName: string,
  getter: (id: string) => Promise<UserOwnedObj>
) {
  if (!(headerName in req.headers)) {
    return;
  }
  const id = req.headers[headerName]?.toString();
  const obj = await getter(id);
  if (!obj || obj.deleted) {
    throw new NotFoundError(`${objectTypeName} not found`);
  }
  const hasAccess = obj.userId === req.user.id || req.user.admin;
  if (!hasAccess) {
    throw new ForbiddenError(`access forbidden`);
  }
}

function anyGetterByPlaybackId(req: Request) {
  return async (id: string) => {
    const { asset, stream, session } = await getResourceByPlaybackId(
      id,
      req.user
    );
    return asset || stream || session;
  };
}

const app = Router();

app.all(
  "/",
  authorizer({ originalUriHeader: "x-original-uri" }),
  async (req, res) => {
    await checkUserOwned(req, "x-livepeer-stream-id", "stream", db.stream.get);
    await checkUserOwned(req, "x-livepeer-asset-id", "asset", db.asset.get);
    await checkUserOwned(
      req,
      "x-livepeer-playback-id",
      "playback ID",
      anyGetterByPlaybackId(req)
    );

    res.header("x-livepeer-user-id", req.user.id);
    res.status(204).end();
  }
);

export default app;
