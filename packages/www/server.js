// Programmatic entrypoint into the Next.js server for `pkg` purposes.

const next = require("next");
const config = require("./next.config.js");
const { normalizeConfig } = require("next/dist/server/config-shared");
const {
  PHASE_PRODUCTION_SERVER,
} = require("next/dist/shared/lib/constants.js");

const getApp = async () => {
  // Workaround for https://github.com/vercel/pkg/issues/1962
  const normalizedConfig = await normalizeConfig(
    PHASE_PRODUCTION_SERVER,
    config
  );
  const app = next({
    dir: __dirname,
    dev: false,
    conf: normalizedConfig,
  });
  await app.prepare();
  return app.getRequestHandler();
};
module.exports = getApp;
