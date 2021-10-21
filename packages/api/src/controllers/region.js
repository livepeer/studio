import Router from "express/lib/router";
import { authMiddleware, validatePost } from "../middleware";
import { db } from "../store";

const defaultScore = 1;

const app = Router();

function flatRegions(regions = []) {
  return regions.flatMap((reg) =>
    reg.orchestrators.map((orch) => ({
      score: defaultScore,
      region: reg.region,
      ...orch,
    }))
  );
}

export async function regionsGetter() {
  const [regions, cursor] = await db.region.find({}, { limit: 100 });

  return flatRegions(regions);
}

app.get("/", async (req, res, next) => {
  const [regions, cursor] = await db.region.find({}, { limit: 100 });
  if (req.query.grouped === "true") {
    return res.json(regions);
  }

  return res.json(flatRegions(regions));
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
  authMiddleware({ anyAdmin: true }),
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
  }
);

app.delete(
  "/:region",
  authMiddleware({ anyAdmin: true }),
  async (req, res, next) => {
    await db.region.delete(req.params.region);
    return res.status(204);
  }
);

export default app;
