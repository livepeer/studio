import { Router } from "express";
import signingKeyApp from "./signing-key";

const accessControl = Router();

const app = Router();

accessControl.use("/signing-key", signingKeyApp);
app.use("/access-control", accessControl);

export default accessControl;
