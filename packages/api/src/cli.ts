#!/usr/bin/env node

import makeStreamInfoSvc from "./app/stream-info/stream-info-app";
import "./dotenv";
import makeApp from "./index";
import activeCleanup from "./jobs/active-cleanup";
import createDbTables from "./jobs/create-db-tables";
import updateUsage from "./jobs/update-usage";
import parseCli from "./parse-cli";

if (require.main === module) {
  const args = parseCli();
  if (args.streamInfoService) {
    makeStreamInfoSvc(args);
  } else if (args.job === "active-cleanup") {
    activeCleanup(args);
  } else if (args.job === "create-db-tables") {
    createDbTables(args);
  } else if (args.job === "update-usage") {
    updateUsage(args);
  } else {
    makeApp(args);
  }
}
