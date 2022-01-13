// Programmatic entrypoint into the Next.js server for `pkg` purposes

// Unsure why this doesn't get properly included in pkg otherwise...

const nextConfig = require("./next.config");
// server.js
const { createServer } = require("http");
const next = require("next");

const app = next({ dir: __dirname, conf: nextConfig, dev: false });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3040;

app.prepare().then(() => {
  createServer(handle).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
