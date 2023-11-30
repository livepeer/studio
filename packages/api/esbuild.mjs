import * as esbuild from "esbuild";
import { readFile } from "fs/promises";

let envPlugin = {
  name: "env",
  setup(build) {
    // Any files from the static-build directory should be
    build.onLoad({ filter: /.*static\-build.*/ }, async (args) => {
      const contents = await readFile(args.path);
      return {
        contents: contents,
        loader: "binary",
      };
    });
  },
};

(async () => {
  await esbuild.build({
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    platform: "node",
    outfile: "./dist-esbuild/api.js",
    target: "node18",
    alias: {
      "@livepeer.studio/www": "./src/frontend-stub.ts",
    },
    external: ["pg-native"],
    sourcemap: "inline",
    // loader: {
    //   "/home/iameli/code/studio/packages/www/static-build/index.html": "binary",
    // },
    plugins: [envPlugin],
  });
})();
