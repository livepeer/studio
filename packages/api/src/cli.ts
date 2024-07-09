#!/usr/bin/env node

import makeStreamInfoSvc from "./app/stream-info/stream-info-app";
import "./dotenv";
import makeApp from "./index";
import { runJob } from "./jobs";
import parseCli from "./parse-cli";

if (require.main === module) {
  const args = parseCli();
  if (args.streamInfoService) {
    makeStreamInfoSvc(args);
  } else if (args.job) {
    runJob(args.job, args);
  } else {
    makeApp(args);
  }
}
