#!/usr/bin/env node

import "./dotenv";
import makeApp from "./index";
import parseCli from "./parse-cli";

if (!module.parent) {
  if (process.env.LP_API_STREAM_INFO_SERVICE === "true") {
    require("./stream-info-service");
  } else {
    makeApp(parseCli());
  }
}
