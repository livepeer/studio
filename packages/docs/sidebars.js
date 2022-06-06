const guidesToc = require("./docs/guides/toc");
const referencesToc = require("./docs/references/toc");
const toc = require("./docs/quick-start/toc");

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  quickStart: toc,
  guides: guidesToc,
  referencesToc: referencesToc,
};

module.exports = sidebars;
