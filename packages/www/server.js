// Programmatic entrypoint into the Next.js server for `pkg` purposes. Kind of
// hacky. Really this should just get compiled to static JS and included that
// way. But this was expedient for livepeer-in-a-box.
//
// On the off chance you're here to add more command line parameters in this
// file, you should figure out how to reuse the logic in
// ../api/src/yargs-to-mist.ts.

const yargs = require("yargs");
const nextConfig = require("./next.config");
const { createServer } = require("http");
const next = require("next");
const pkg = require("./package.json");

const app = next({ dir: __dirname, conf: nextConfig, dev: false });
const handle = app.getRequestHandler();
const cli = yargs.options({
  port: {
    type: "number",
    default: 3012,
  },
}).argv;

if (cli.j) {
  const description = {
    name: "livepeer-www",
    friendly: "Livepeer Dashboard",
    desc: "Livepeer Next.js Dashboard Front-end Server",
    optional: {
      port: {
        option: "--port",
        default: 3012,
        help: "Port to run on",
      },
    },
    version: pkg.version,
  };
  console.log(JSON.stringify(description));
  process.exit(0);
}

app.prepare().then(() => {
  createServer(handle).listen(cli.port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${cli.port}`);
  });
});
