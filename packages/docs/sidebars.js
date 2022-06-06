const guidesToc = require("./docs/guides/toc");
const referencesToc = require("./docs/references/toc");
const buidlToc = require("./docs/buidl-quick-start/toc");

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  buidl: buidlToc,
  guides: guidesToc,
  referencesToc: referencesToc,
};

module.exports = sidebars;
