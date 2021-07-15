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
        destination: "/docs/api-reference/stream/stream",
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
        source: "/app/stream/:id",
        destination: "/dashboard/streams/:id",
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
