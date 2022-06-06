// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Livepeer Studio Docs",
  tagline: "The world's open video infrastructure",
  url: "https://livepeer.studio",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "livepeer",
  projectName: "docs",
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/",
          breadcrumbs: true,
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/livepeer/docs/blob/main",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        googleAnalytics: {
          trackingID: "UA-111259858-1",
          anonymizeIP: true,
        },
      }),
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      algolia: {
        appId: "TIWEI9YB8Y",
        apiKey: "bee5caa76c6df12c16be24f2f04e7c7c",
        indexName: "2022-livepeer-org-docs",
        contextualSearch: true,
      },
      navbar: {
        title: "Livepeer Docs",
        logo: {
          alt: "Livepeer Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            href: "/buidl-quick-start",
            label: "Buidl",
            position: "left",
          },
          {
            href: "/guides",
            label: "Guides",
            position: "left",
          },
          {
            href: "/references",
            label: "API",
            position: "left",
          },
          {
            href: "https://forum.livepeer.com/",
            label: "Forum",
            position: "left",
          },
          {
            href: "https://livepeer.com",
            label: "Follow us",
            position: "right",
          },
          {
            href: "https://livepeer.com",
            label: "Support",
            position: "right",
          },
          {
            href: "https://livepeer.com/dashboard",
            label: "Dashboard",
            position: "right",
          },
        ],
      },
      colorMode: {
        defaultMode: "dark",
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.gg/uaPhtyrWsF",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/LivepeerOrg",
              },
              {
                label: "Blog",
                href: "https://medium.com/livepeer-blog",
              },
              {
                label: "Forum",
                href: "https://forum.livepeer.org/",
              },
              {
                label: "Reddit",
                href: "https://www.reddit.com/r/livepeer/",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Livepeer, Inc.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
