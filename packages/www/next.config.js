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
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "https://docs.livepeer.studio",
        permanent: false,
      },
      {
        source: "/docs/api",
        destination: "https://docs.livepeer.studio/category/api",
        permanent: false,
      },
      {
        source: "/app/user",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/app/user/keys",
        destination: "/developers/api-keys",
        permanent: false,
      },
      {
        source: "/app/user/billing",
        destination: "/billing",
        permanent: false,
      },
      {
        source: "/app/user/plans",
        destination: "/billing/plans",
        permanent: false,
      },
      {
        source: "/app/test-player",
        destination: "/stream-health",
        permanent: false,
      },
      {
        source: "/plans",
        destination: "/billing/plans",
        permanent: false,
      },
      {
        source: "/app/user/usage",
        destination: "/usage",
        permanent: false,
      },
      {
        source: "/billing/usage",
        destination: "/usage",
        permanent: false,
      },
      {
        source: "/jobs/technical-writer",
        destination: "/jobs/1496366",
        permanent: false,
      },
      {
        source: "/jobs/full-stack-video-engineer",
        destination: "/jobs/1412799",
        permanent: false,
      },
      {
        source: "/jobs/operations-manager",
        destination: "/jobs/1466566",
        permanent: false,
      },
      {
        source: "/jobs/video-developer-community-manager",
        destination: "/jobs/1476601",
        permanent: false,
      },
      {
        source: "/jobs/web3-developer-evangelist",
        destination: "/jobs/1491881",
        permanent: false,
      },
      {
        source: "/jobs/chief-operating-officer",
        destination: "/jobs/1466562",
        permanent: false,
      },
      {
        source: "/jobs/senior-video-infrastructure-engineer",
        destination: "/jobs/1414584",
        permanent: false,
      },
      {
        source: "/jobs/video-developer-success-manager",
        destination: "/jobs/1476607",
        permanent: false,
      },
      {
        source: "/jobs/senior-software-engineer-video-transcoding",
        destination: "/jobs/1412803",
        permanent: false,
      },
      {
        source: "/jobs/analytics-engineer",
        destination: "/jobs/1496262",
        permanent: false,
      },
      {
        source: "/jobs/protocol-engineer",
        destination: "/jobs/1412804",
        permanent: false,
      },
      {
        source: "/jobs/investor-relations-manager",
        destination: "/jobs/1454503",
        permanent: false,
      },
      {
        source: "/jobs/senior-product-marketing-manager",
        destination: "/jobs/1454194",
        permanent: false,
      },
      {
        source: "/jobs/senior-lead-product-manager",
        destination: "/jobs/1454194",
        permanent: false,
      },
      {
        source: "/jobs/content-marketing",
        destination: "/jobs/1476609",
        permanent: false,
      },
      {
        source: "/jobs/marketing-manager",
        destination: "/jobs/1412808",
        permanent: false,
      },
      {
        source: "/jobs/events-manager",
        destination: "/jobs/1454453",
        permanent: false,
      },
      {
        source: "/jobs/engineering-manager-livepeer-core-software",
        destination: "/jobs/1478605",
        permanent: false,
      },
      {
        source: "/jobs/technical-product-manager-orchestrator-experience",
        destination: "/jobs/1496214",
        permanent: false,
      },
      {
        source: "/team",
        destination:
          "https://livepeer.notion.site/livepeer/Livepeer-Inc-6898d5451e2b40e79b1225812f4f1705",
        permanent: false,
      },
      {
        source: "/changelog",
        destination: "https://livepeer.canny.io",
        permanent: false,
      },
    ];
  },
};

if (isStaticBuild) {
  config = {
    ...config,
    output: "export",
    distDir: "static-build",
  };
} else {
  config = {
    ...config,
    i18n: {
      locales: ["en", "es"],
      defaultLocale: "en",
    },
    async redirects() {
      return [
        {
          source: "/docs",
          destination: "https://docs.livepeer.studio",
          permanent: false,
        },
        {
          source: "/docs/api",
          destination: "https://docs.livepeer.studio/category/api",
          permanent: false,
        },
        {
          source: "/app/user",
          destination: "/dashboard",
          permanent: false,
        },
        {
          source: "/app/user/keys",
          destination: "/dashboard/developers/api-keys",
          permanent: false,
        },
        {
          source: "/app/user/billing",
          destination: "/dashboard/billing",
          permanent: false,
        },
        {
          source: "/app/user/plans",
          destination: "/dashboard/billing/plans",
          permanent: false,
        },
        {
          source: "/app/test-player",
          destination: "/dashboard/stream-health",
          permanent: false,
        },
        {
          source: "/dashboard/plans",
          destination: "/dashboard/billing/plans",
          permanent: false,
        },
        {
          source: "/app/user/usage",
          destination: "/dashboard/usage",
          permanent: false,
        },
        {
          source: "/dashboard/billing/usage",
          destination: "/dashboard/usage",
          permanent: false,
        },
        {
          source: "/jobs/technical-writer",
          destination: "/jobs/1496366",
          permanent: false,
        },
        {
          source: "/jobs/full-stack-video-engineer",
          destination: "/jobs/1412799",
          permanent: false,
        },
        {
          source: "/jobs/operations-manager",
          destination: "/jobs/1466566",
          permanent: false,
        },
        {
          source: "/jobs/video-developer-community-manager",
          destination: "/jobs/1476601",
          permanent: false,
        },
        {
          source: "/jobs/web3-developer-evangelist",
          destination: "/jobs/1491881",
          permanent: false,
        },
        {
          source: "/jobs/chief-operating-officer",
          destination: "/jobs/1466562",
          permanent: false,
        },
        {
          source: "/jobs/senior-video-infrastructure-engineer",
          destination: "/jobs/1414584",
          permanent: false,
        },
        {
          source: "/jobs/video-developer-success-manager",
          destination: "/jobs/1476607",
          permanent: false,
        },
        {
          source: "/jobs/senior-software-engineer-video-transcoding",
          destination: "/jobs/1412803",
          permanent: false,
        },
        {
          source: "/jobs/analytics-engineer",
          destination: "/jobs/1496262",
          permanent: false,
        },
        {
          source: "/jobs/protocol-engineer",
          destination: "/jobs/1412804",
          permanent: false,
        },
        {
          source: "/jobs/investor-relations-manager",
          destination: "/jobs/1454503",
          permanent: false,
        },
        {
          source: "/jobs/senior-product-marketing-manager",
          destination: "/jobs/1454194",
          permanent: false,
        },
        {
          source: "/jobs/senior-lead-product-manager",
          destination: "/jobs/1454194",
          permanent: false,
        },
        {
          source: "/jobs/content-marketing",
          destination: "/jobs/1476609",
          permanent: false,
        },
        {
          source: "/jobs/marketing-manager",
          destination: "/jobs/1412808",
          permanent: false,
        },
        {
          source: "/jobs/events-manager",
          destination: "/jobs/1454453",
          permanent: false,
        },
        {
          source: "/jobs/engineering-manager-livepeer-core-software",
          destination: "/jobs/1478605",
          permanent: false,
        },
        {
          source: "/jobs/technical-product-manager-orchestrator-experience",
          destination: "/jobs/1496214",
          permanent: false,
        },
        {
          source: "/team",
          destination:
            "https://livepeer.notion.site/livepeer/Livepeer-Inc-6898d5451e2b40e79b1225812f4f1705",
          permanent: false,
        },
      ];
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
