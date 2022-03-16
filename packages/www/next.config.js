const withPlugins = require("next-compose-plugins");
const emoji = require("remark-emoji");
const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [emoji],
  },
});

const config = {
  images: {
    domains: ["cdn.sanity.io"],
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/guides",
        permanent: false,
      },
      {
        source: "/docs/api",
        destination: "/docs/api-reference",
        permanent: false,
      },
      {
        source: "/docs/api/stream",
        destination: "/docs/api-reference/stream/overview",
        permanent: false,
      },
      {
        source: "/docs/api/stream/post-stream",
        destination: "/docs/api-reference/stream/post-stream",
        permanent: false,
      },
      {
        source: "/docs/api/stream/get-stream",
        destination: "/docs/api-reference/stream/get-stream",
        permanent: false,
      },
      {
        source: "/docs/api/stream/get-session",
        destination: "/docs/api-reference/session/get-session",
        permanent: false,
      },
      {
        source: "/docs/api/stream/record-on-off",
        destination: "/docs/api-reference/stream/record-on-off",
        permanent: false,
      },
      {
        source: "/docs/api/stream/get-recorded-sessions",
        destination: "/docs/api-reference/session/list-recorded-sessions",
        permanent: false,
      },
      {
        source: "/docs/api/stream/list",
        destination: "/docs/api-reference/stream/list",
        permanent: false,
      },
      {
        source: "/docs/api/ingest",
        destination: "/docs/api-reference/ingest",
        permanent: false,
      },
      {
        source: "/docs/api/authentication",
        destination: "/docs/api-reference/authentication",
        permanent: false,
      },
      {
        source: "/docs/api/errors",
        destination: "/docs/api-reference/errors",
        permanent: false,
      },
      {
        source: "/docs/api/api-key",
        destination: "/docs/api-reference/api-key",
        permanent: false,
      },
      {
        source: "/docs/api",
        destination: "/docs/guides/api",
        permanent: false,
      },
      {
        source: "/docs/guides/api/overview",
        destination: "/docs/api-reference",
        permanent: false,
      },
      {
        source: "/docs/guides/api/broadcast-a-live-stream",
        destination: "/docs/guides/start-live-streaming/broadcasting",
        permanent: false,
      },
      {
        source: "/docs/guides/api-keys/when-do-you-need-an-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: false,
      },
      {
        source: "/docs/guides/api-keys/create-an-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: false,
      },
      {
        source: "/docs/guides/api-keys/delete-an-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: false,
      },
      {
        source: "/docs/guides/api/verify-stream-status",
        destination: "/docs/guides/start-live-streaming/verify",
        permanent: false,
      },
      {
        source: "/docs/guides/dashboard/create-a-stream",
        destination:
          "/docs/guides/start-live-streaming/tutorial#create-a-stream",
        permanent: false,
      },
      {
        source: "/docs/guides/api/playback-a-live-stream",
        destination: "/docs/guides/start-live-streaming/playback",
        permanent: false,
      },
      {
        source: "/docs/guides/api/record-stream",
        destination: "/docs/guides/start-live-streaming/record",
        permanent: false,
      },
      {
        source: "/docs/guides/dashboard/record-stream",
        destination: "/docs/guides/start-live-streaming/record",
        permanent: false,
      },
      {
        source: "/docs/guides/debugging-guide",
        destination:
          "/docs/guides/start-live-streaming/debug-live-stream-issues",
        permanent: false,
      },
      {
        source: "/docs/guides/support-matrix",
        destination: "/docs/guides/start-live-streaming/support-matrix",
        permanent: false,
      },
      {
        source: "/docs/livepeer-dot-com/create-a-stream",
        destination: "/docs/guides/start-live-streaming/create-a-stream",
        permanent: false,
      },
      {
        source: "/docs/livepeer-api/create-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: false,
      },
      {
        source: "/docs/guides/application-development/contact",
        destination: "/docs/guides/application-development/example-app",
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
        source: "/app/user/usage",
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
        source: "/blog/docs/guides/start-live-streaming/broadcasting",
        destination: "/docs/guides/start-live-streaming/broadcasting",
        permanent: false,
      },
      {
        source: "/dashboard/plans",
        destination: "/dashboard/billing/plans",
        permanent: false,
      },
      {
        source: "/docs/api-reference/stream/stream",
        destination: "/docs/api-reference/stream",
        permanent: false,
      },
      {
        source: "/docs/docs/guides/start-live-streaming/verify",
        destination: "/docs/guides/start-live-streaming/verify",
        permanent: false,
      },
      {
        source: "/docs/guides/media-server",
        destination: "/docs/guides/media-server/introduction",
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
    ];
  },
};

module.exports = withPlugins(
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
          return config;
        },
      },
    ],
  ],
  config
);
