#!/usr/bin/env node

import "./dotenv";
import makeApp from "./index";
import parseCli from "./parse-cli";

if (!module.parent) {
  makeApp(parseCli());
}
