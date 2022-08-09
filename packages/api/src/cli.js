#!/usr/bin/env node

import "./dotenv";
import makeApp from "./index";
import parseCli from "./parse-cli";

if (require.main === module) {
  if (process.env.LP_API_STREAM_INFO_SERVICE === "true") {
    require("./stream-info-service");
  } else {
    makeApp(parseCli());
  }
}
