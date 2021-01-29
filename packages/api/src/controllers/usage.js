import Router from "express/lib/router";
import { db } from "../store";

const app = Router();

app.get("/", async (req, res) => {
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

app.post("/update", async (req, res) => {
  let { apiToken } = req.body;

  if (!apiToken) {
    res.status(403);
    return res.json({ errors: ["missing api token"] });
  }

  if (process.env.LP_API_TOKEN != req.body.apiToken) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  let fromTime = +new Date(2020, 0); // start at beginning
  let toTime = +new Date();

  let cachedUsageHistory = await db.stream.cachedUsageHistory(
    fromTime,
    toTime,
    {
      useReplica: true,
    }
  );

  // get last updated date from cache
  if (cachedUsageHistory.length) {
    fromTime = cachedUsageHistory[cachedUsageHistory.length - 1].date;
  }

  // get all usage up until now
  toTime = new Date().getTime();

  let usageHistory = await db.stream.usageHistory(fromTime, toTime, {
    useReplica: true,
  });

  // store each day of usage
  for (const row of usageHistory) {
    // if row already exists in cache, update it, otherwise create it
    if (cachedUsageHistory.find((c) => c.id === row.id)) {
      await req.store.replace({ kind: "usage", ...row });
    } else {
      await req.store.create({ kind: "usage", ...row });
    }
  }

  res.status(200);
  res.json(usageHistory);
});

export default app;
