const withPlugins = require("next-compose-plugins");
const emoji = require("remark-emoji");
const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [emoji],
  },
});
const withTM = require("next-transpile-modules")(["react-use-mailchimp"]);

const config = {
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/guides",
        permanent: true,
      },
      {
        source: "/docs/api",
        destination: "/docs/api-reference",
        permanent: true,
      },
      {
        source: "/docs/api/stream",
        destination: "/docs/api-reference/stream/stream",
        permanent: true,
      },
      {
        source: "/docs/api/stream/post-stream",
        destination: "/docs/api-reference/stream/post-stream",
        permanent: true,
      },
      {
        source: "/docs/api/stream/get-stream",
        destination: "/docs/api-reference/stream/get-stream",
        permanent: true,
      },
      {
        source: "/docs/api/stream/get-session",
        destination: "/docs/api-reference/session/get-session",
        permanent: true,
      },
      {
        source: "/docs/api/stream/record-on-off",
        destination: "/docs/api-reference/stream/record-on-off",
        permanent: true,
      },
      {
        source: "/docs/api/stream/get-recorded-sessions",
        destination: "/docs/api-reference/session/list-recorded-sessions",
        permanent: true,
      },
      {
        source: "/docs/api/stream/list",
        destination: "/docs/api-reference/stream/list",
        permanent: true,
      },
      {
        source: "/docs/api/ingest",
        destination: "/docs/api-reference/ingest",
        permanent: true,
      },
      {
        source: "/docs/api/authentication",
        destination: "/docs/api-reference/authentication",
        permanent: true,
      },
      {
        source: "/docs/api/errors",
        destination: "/docs/api-reference/errors",
        permanent: true,
      },
      {
        source: "/docs/api/api-key",
        destination: "/docs/api-reference/api-key",
        permanent: true,
      },
      {
        source: "/docs/api",
        destination: "/docs/guides/api",
        permanent: true,
      },
      {
        source: "/docs/guides/api/broadcast-a-live-stream",
        destination: "/docs/guides/start-live-streaming/broadcasting",
        permanent: true,
      },
      {
        source: "/docs/guides/api-keys/when-do-you-need-an-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: true,
      },
      {
        source: "/docs/guides/api-keys/create-an-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: true,
      },
      {
        source: "/docs/guides/api-keys/delete-an-api-key",
        destination: "/docs/guides/start-live-streaming/api-key",
        permanent: true,
      },
      {
        source: "/docs/guides/api/verify-stream-status",
        destination: "/docs/guides/start-live-streaming/verify",
        permanent: true,
      },
      {
        source: "/docs/guides/dashboard/create-a-stream",
        destination:
          "/docs/guides/start-live-streaming/tutorial#create-a-stream",
        permanent: true,
      },
      {
        source: "/docs/guides/api/playback-a-live-stream",
        destination: "/docs/guides/start-live-streaming/playback",
        permanent: true,
      },
      {
        source: "/docs/guides/api/record-stream",
        destination: "/docs/guides/start-live-streaming/record",
        permanent: true,
      },
      {
        source: "/docs/guides/dashboard/record-stream",
        destination: "/docs/guides/start-live-streaming/record",
        permanent: true,
      },
      {
        source: "/docs/guides/debugging-guide",
        destination:
          "/docs/guides/start-live-streaming/debug-live-stream-issues",
        permanent: true,
      },
      {
        source: "/docs/guides/support-matrix",
        destination: "/docs/guides/start-live-streaming/support-matrix",
        permanent: true,
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
    withTM,
  ],
  config
);
