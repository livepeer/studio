import { Router } from "express";
import { authorizer, validatePost } from "../middleware";
import { db } from "../store";

const defaultScore = 1;

const app = Router();

function flatRegions(regions = [], halfRegionOrchestratorsUntrusted = false) {
  let count = 0;
  return regions.flatMap((reg) =>
    reg.orchestrators.map((orch) => ({
      score:
        halfRegionOrchestratorsUntrusted && count++ % 2 == 0 ? 0 : defaultScore,
      region: reg.region,
      ...orch,
    })),
  );
}

export async function regionsGetter(halfRegionOrchestratorsUntrusted = false) {
  const [regions, cursor] = await db.region.find({}, { limit: 100 });

  return flatRegions(regions, halfRegionOrchestratorsUntrusted);
}

app.get("/", async (req, res, next) => {
  const [regions, cursor] = await db.region.find({}, { limit: 100 });
  if (req.query.grouped === "true") {
    return res.json(regions);
  }

  return res.json(
    flatRegions(regions, req.config.halfRegionOrchestratorsUntrusted),
  );
});

app.get("/:region", async (req, res, next) => {
  const region = await db.region.get(req.params.region);
  if (!region) {
    res.status(404);
    return res.json({ errors: ["not found"] });
  }

  return res.json(region);
});

app.put(
  "/:region",
  authorizer({ anyAdmin: true }),
  validatePost("region"),
  async (req, res, next) => {
    let region = {
      region: req.body.region,
      orchestrators: req.body.orchestrators || [],
    };

    const currentRegion = await db.region.get(req.body.region);

    if (currentRegion) {
      const updateResp = await db.region.update(req.params.region, region);
    } else {
      const resp = await db.region.create({
        id: region.region,
        kind: "region",
        region: region.region,
        orchestrators: region.orchestrators,
      });
    }

    return res.json(region);
  },
);

app.delete(
  "/:region",
  authorizer({ anyAdmin: true }),
  async (req, res, next) => {
    await db.region.delete(req.params.region);
    return res.status(204);
  },
);

export default app;
