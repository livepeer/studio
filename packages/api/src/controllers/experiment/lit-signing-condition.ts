import { Router } from "express";
import { NotImplementedError } from "../../store/errors";

const app = Router();

app.post("/verify-lit-jwt", async (req, res) => {
  throw new NotImplementedError(
    "verify-lit-jwt not implemented here, only a dummy example"
  );
});

export default app;
