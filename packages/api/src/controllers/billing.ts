import { Router } from "express";
import _ from "lodash";
import { db } from "../store";
import { authorizer } from "../middleware";

const app = Router();

app.post("/hourly-usage", authorizer({}), async (req, res) => {
  let userId = req.user.id;

  let dateFrom = req.body.dateFrom;
  let dateTo = req.body.dateTo;

  let hourlyUsage = await db.billingTable.getHourlyUsage(
    userId,
    dateFrom,
    dateTo
  );

  res.status(200).json(hourlyUsage);
});

export default app;
