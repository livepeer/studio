const withPlugins = require("next-compose-plugins");
const emoji = require("remark-emoji");
const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [emoji]
  }
});
const withTM = require("next-transpile-modules")(["react-use-mailchimp"]);

module.exports = withPlugins([
  [
    withMDX,
    {
      pageExtensions: ["js", "jsx", "mdx", "ts", "tsx", "svg"],
      webpack(config, _options) {
        config.module.rules.push({
          test: /\.(graphql|gql)$/,
          exclude: /node_modules/,
          loader: "graphql-tag/loader"
        });
        config.module.rules.push({
          test: /\.md$/,
          use: "raw-loader"
        });
        return config;
      }
    }
  ],
  withTM
]);

// module.exports = withMDX({
//   pageExtensions: ["js", "jsx", "mdx", "ts", "tsx", "svg"],
//   webpack(config, _options) {
//     config.module.rules.push({
//       test: /\.(graphql|gql)$/,
//       exclude: /node_modules/,
//       loader: "graphql-tag/loader"
//     });
//     config.module.rules.push({
//       test: /\.md$/,
//       use: "raw-loader"
//     });
//     return config;
//   }
// });
