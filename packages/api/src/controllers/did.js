import { Router } from "express";

const app = Router();

app.get("/", (req, res) => {
  const did = req.config.did;
  if (did) {
    res.json({ did });
  } else {
    res.status(501);
    res.json({ errors: ["DID key not configured"] });
  }
});

export default app;
