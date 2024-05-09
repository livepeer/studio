import Stripe from "stripe";
import { initClients } from "../app-router";
import { reportUsage } from "../controllers/stripe";
import logger from "../logger";
import { CliArgs } from "../parse-cli";
import { DB } from "../store/db";

export default async function updateUsage(
  config: CliArgs,
  clients?: { jobsDb: DB; stripe: Stripe }
) {
  const startTime = process.hrtime();
  const { jobsDb, stripe } =
    clients ?? (await initClients(config, "update-usage-job"));

  let {
    updateUsageFrom: fromTime,
    updateUsageTo: toTime,
    updateUsageApiToken: token,
  } = config;

  // if time range isn't specified return all usage
  if (!fromTime) {
    let rows = (
      await jobsDb.usage.find(
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

  const usageHistory = await jobsDb.stream.usageHistory(fromTime, toTime, {
    useReplica: true,
  });
  logger.info(
    `Updating usage from=${fromTime} to=${toTime} usageHistory=${JSON.stringify(
      usageHistory
    )}`
  );

  // store each day of usage
  for (const row of usageHistory) {
    const dbRow = await jobsDb.usage.get(row.id);
    // if row already exists in cache, update it, otherwise create it
    if (dbRow) {
      await jobsDb.usage.replace({ kind: "usage", ...row });
    } else {
      await jobsDb.usage.create({ kind: "usage", ...row });
    }
  }

  // New automated billing usage report
  const { updatedUsers } = await reportUsage(stripe, config, token);

  const elapsedTime = process.hrtime(startTime);
  const elapsedTimeSec = elapsedTime[0] + elapsedTime[1] / 1e9;
  logger.info(
    `Ran update-usage job. elapsedTime=${elapsedTimeSec}s from=${fromTime} to=${toTime} numUpdatedUsers=${updatedUsers.length}`
  );
  return { usageHistory, updatedUsers };
}
