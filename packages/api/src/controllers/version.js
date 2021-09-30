import Router from "express/lib/router";

const app = Router();

app.get("/", async (req, res) => {
  res.status(200);
  res.json({
    tag: `${process.env.VERSION || "local"}`,
    commit: `${process.env.GITHUB_SHA || "local"}`,
  });
});

export default app;
