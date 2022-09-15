/**
 * Special controller for forwarding all incoming requests to a geolocated API region
 */

import { Router } from "express";
import { authorizer } from "../middleware";
import { db } from "../store";
import { ForbiddenError, NotFoundError } from "../store/errors";
import Table from "../store/table";

type UserOwnedObj = { id: string; deleted?: boolean; userId?: string };

const app = Router();

app.all(
  "/",
  authorizer({ originalUriHeader: "x-original-uri" }),
  async (req, res) => {
    const checkUserOwned = async (
      headerName: string,
      table: Table<UserOwnedObj>
    ) => {
      if (!(headerName in req.headers)) {
        return;
      }
      const id = req.headers[headerName]?.toString();
      const obj = await table.get(id);
      if (!obj || obj.deleted) {
        throw new NotFoundError(`${table.name} not found`);
      }
      const hasAccess = obj.userId === req.user.id || req.user.admin;
      if (!hasAccess) {
        throw new ForbiddenError(`access forbidden`);
      }
    };
    await checkUserOwned("x-livepeer-stream-id", db.stream);
    await checkUserOwned("x-livepeer-asset-id", db.asset);
    res.status(204).end();
  }
);

export default app;
