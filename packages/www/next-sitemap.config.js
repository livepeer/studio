module.exports = {
  siteUrl: "https://livepeer.studio",
  generateRobotsTxt: true,
  exclude: ["/home"],
  sourceDir: "./.next",
  transform: (config, url) => {
    // ignore urls in dashboard behind login
    if (url.includes("/app")) {
      return null;
    }
    return {
      loc: url,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
