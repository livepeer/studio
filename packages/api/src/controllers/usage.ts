import Router from "express/lib/router";
import { db } from "../store";
import { authorizer, validatePost } from "../middleware";
import { products } from "../config";
import { reportUsage } from "./stripe";
import fetch from "node-fetch";
import qs from "qs";
import { NotFoundError } from "../store/errors";

const app = Router();

export const getBillingUsage = async (
  userId: string,
  fromTime: number,
  toTime: number,
  baseUrl: string,
  adminToken: string
) => {
  // Fetch usage data from /data/usage endpoint
  const usage = await fetch(
    `${baseUrl}/api/data/usage/query?${qs.stringify({
      from: fromTime,
      to: toTime,
      userId: userId,
    })}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    }
  ).then((res) => res.json());

  return usage;
};

export const calculateOverUsage = async (product, usage) => {
  let limits: any = {};

  if (product?.usage) {
    product.usage.forEach((item) => {
      if (item.name.toLowerCase() === "transcoding")
        limits.transcoding = item.limit;
      if (item.name.toLowerCase() === "delivery") limits.streaming = item.limit;
      if (item.name.toLowerCase() === "storage") limits.storage = item.limit;
    });
  }

  const overUsage = {
    TotalUsageMins: Math.max(
      usage?.TotalUsageMins - (limits.transcoding || 0),
      0
    ),
    DeliveryUsageMins: Math.max(
      usage?.DeliveryUsageMins - (limits.streaming || 0),
      0
    ),
    StorageUsageMins: Math.max(
      usage?.StorageUsageMins - (limits.storage || 0),
      0
    ),
  };

  return overUsage;
};

app.get("/", authorizer({ anyAdmin: true }), async (req, res) => {
  let { fromTime, toTime } = req.query;

  // if time range isn't specified return all usage
  if (!fromTime && !toTime) {
    fromTime = +new Date(2020, 0); // start at beginning
    toTime = +new Date();
  }

  const cachedUsageHistory = await db.stream.cachedUsageHistory(
    fromTime,
    toTime,
    {
      useReplica: true,
    }
  );

  res.status(200);
  res.json(cachedUsageHistory);
});

app.get("/user", authorizer({ anyAdmin: true }), async (req, res) => {
  let { fromTime, toTime } = req.query;

  // if time range isn't specified return all usage
  if (!fromTime && !toTime) {
    fromTime = +new Date(2020, 0); // start at beginning
    toTime = +new Date();
  }

  if (!req.query.userId) {
    res.status(400);
    res.json({ error: "userId is required" });
    return;
  }

  const ingests = await req.getIngest();

  const usage = await getBillingUsage(
    req.query.userId,
    fromTime,
    toTime,
    ingests[0].origin,
    req.token.id
  );

  res.status(200);
  res.json(usage);
});

app.get("/user/overage", authorizer({ anyAdmin: true }), async (req, res) => {
  let { fromTime, toTime } = req.query;

  // if time range isn't specified return all usage
  if (!fromTime && !toTime) {
    fromTime = +new Date(2020, 0); // start at beginning
    toTime = +new Date();
  }

  if (!req.query.userId) {
    res.status(400);
    res.json({ error: "userId is required" });
    return;
  }

  const user = await db.user.get(req.query.userId);

  if (!user) {
    throw new NotFoundError(`user not found: ${req.query.userId}`);
  }

  const ingests = await req.getIngest();

  const usage = await getBillingUsage(
    req.query.userId,
    fromTime,
    toTime,
    ingests[0].origin,
    req.token.id
  );

  const overage = await calculateOverUsage(
    products[user.stripeProductId],
    usage
  );

  res.status(200);
  res.json(overage);
});

app.post(
  "/update",
  authorizer({ anyAdmin: true }),
  validatePost("usage"),
  async (req, res) => {
    let { fromTime, toTime } = req.query;

    /* New usage report for billing
    let token = req.token;
    // New automated billing usage report
    let result = await reportUsage(req, token);

    res.status(200);
    res.json(result);
    let { fromTime, toTime } = req.query;
    */

    // if time range isn't specified return all usage
    if (!fromTime) {
      let rows = (
        await db.usage.find(
          {},
          { limit: 1, order: "data->>'date' DESC", useReplica: true }
        )
      )[0];

      if (rows.length) {
        fromTime = rows[0].date; // get last updated date from cache
      } else {
        fromTime = +new Date(2020, 0); // start at beginning
      }
    }

    if (!toTime) {
      toTime = +new Date();
    }

    let usageHistory = await db.stream.usageHistory(fromTime, toTime, {
      useReplica: true,
    });

    // store each day of usage
    for (const row of usageHistory) {
      const dbRow = await req.store.get(`usage/${row.id}`);
      // if row already exists in cache, update it, otherwise create it
      if (dbRow) {
        await req.store.replace({ kind: "usage", ...row });
      } else {
        await req.store.create({ kind: "usage", ...row });
      }
    }

    res.status(200);
    res.json(usageHistory);
  }
);

export default app;
