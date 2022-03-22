import "source-map-support/register";
import makeApp from "./app/stream-info/stream-info-app";
import yargs from "yargs";
import path from "path";
import os from "os";

function parseCli() {
  return (
    yargs
      .usage(
        `
    Livepeer Stream Info fetcher

    Options my also be provided as LP_API_ prefixed environment variables, e.g. LP_API_PORT=5000 is the same as --port=5000.

    `
      )
      .env("LP_API_")
      //.strict(true)
      .options({
        port: {
          describe: "port to listen on",
          default: 3010,
          demandOption: true,
          type: "number",
        },
        host: {
          describe: "host to bind to",
          type: "string",
          default: "localhost",
        },
        "own-region": {
          describe:
            "identify region in which this service runs (fra, mdw, etc)",
          type: "string",
        },
        broadcaster: {
          describe: "broadcaster host:port to fetch info from",
          type: "string",
          default: "localhost:7935",
        },
        "postgres-url": {
          describe: "url of a postgres database",
          type: "string",
          demandOption: true,
        },
      })
      .help()
      .parse()
  );
}

function main() {
  require("dotenv").config();
  makeApp(parseCli());
}

main();
