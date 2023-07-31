#!/usr/bin/env node

import "./dotenv";
import makeApp from "./index";
import makeStreamInfoSvc from "./app/stream-info/stream-info-app";
import parseCli from "./parse-cli";

if (require.main === module) {
  const args = parseCli();
  if (args.streamInfoService) {
    makeStreamInfoSvc(args);
  } else {
    makeApp(args);
  }
}
