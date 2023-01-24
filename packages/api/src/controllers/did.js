import Router from "express/lib/router";

const app = Router();

app.get("/", (_, res) => {
  res.json({ did: process.env.UCAN_DID || "" });
});

export default app;
