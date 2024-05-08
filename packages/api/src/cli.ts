#!/usr/bin/env node

import makeStreamInfoSvc from "./app/stream-info/stream-info-app";
import "./dotenv";
import makeApp from "./index";
import runActiveCleanup from "./jobs/active-cleanup";
import parseCli from "./parse-cli";

if (require.main === module) {
  const args = parseCli();
  if (args.streamInfoService) {
    makeStreamInfoSvc(args);
  } else if (args.job === "active-cleanup") {
    runActiveCleanup(args);
  } else {
    makeApp(args);
  }
}
