const { withSentryConfig } = require("@sentry/nextjs");
const withPlugins = require("next-compose-plugins");
const emoji = require("remark-emoji");
const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [emoji],
  },
});

const isAnalyzeEnabled = process.env.ANALYZE === "true";
const isStaticBuild = process.env.STATIC_BUILD === "true";

const SentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

let config = {
  basePath: "/dashboard",
  publicRuntimeConfig: { basePath: "/dashboard" },
  sentry: {
    hideSourceMaps: true,
  },
  images: {
    unoptimized: true,
    domains: ["cdn.sanity.io", "picsum.photos"],
  },
};

if (isStaticBuild) {
  config = {
    ...config,
    output: "standalone",
    distDir: "static-build-app",
  };
} else {
  config = {
    ...config,
    i18n: {
      locales: ["en", "es"],
      defaultLocale: "en",
    },
  };
}

let configWithPlugins = withPlugins(
  [
    [
      withMDX,
      {
        pageExtensions: ["js", "jsx", "mdx", "ts", "tsx", "svg"],
        webpack(config, _options) {
          config.module.rules.push({
            test: /\.(graphql|gql)$/,
            exclude: /node_modules/,
            loader: "graphql-tag/loader",
          });
          config.module.rules.push({
            test: /\.md$/,
            use: "raw-loader",
          });
          config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"],
          });
          if (isAnalyzeEnabled) {
            const DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
            config.plugins.push(new DuplicatePackageCheckerPlugin());
          }
          return config;
        },
      },
    ],
    ...(isAnalyzeEnabled
      ? [require("@next/bundle-analyzer")({ enabled: isAnalyzeEnabled })]
      : []),
  ],
  config
);

if (!isStaticBuild) {
  configWithPlugins = withSentryConfig(
    configWithPlugins,
    SentryWebpackPluginOptions
  );
}

module.exports = configWithPlugins;
