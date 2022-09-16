/**
 * Special controller for forwarding all incoming requests to a geolocated API region
 */

import { Request, Router } from "express";
import { authorizer } from "../middleware";
import { db } from "../store";
import { ForbiddenError, NotFoundError } from "../store/errors";
import Table from "../store/table";

type UserOwnedObj = { id: string; deleted?: boolean; userId?: string };

// Grabs the ID from the provided request header, fetches the corresponding
// object in the database table and checks that it is owned by the user making
// the request. Throws a status code error if not.
async function checkUserOwned(
  req: Request,
  headerName: string,
  table: Table<UserOwnedObj>
) {
  const id = req.headers[headerName]?.toString();
  if (!id) {
    return;
  }
  const obj = await table.get(id);
  if (!obj || obj.deleted) {
    throw new NotFoundError(`${table.name} not found`);
  }
  const hasAccess = obj.userId === req.user.id || req.user.admin;
  if (!hasAccess) {
    throw new ForbiddenError(`access forbidden`);
  }
}

const app = Router();

app.all(
  "/",
  authorizer({ originalUriHeader: "x-original-uri" }),
  async (req, res) => {
    await checkUserOwned(req, "x-livepeer-stream-id", db.stream);
    await checkUserOwned(req, "x-livepeer-asset-id", db.asset);
    res.status(204).end();
  }
);

export default app;
