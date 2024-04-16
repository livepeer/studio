// Builds a single-file zero-dependency version of the API server
// with an embedded static version of the frontend.

import * as esbuild from "esbuild";
import { readFile, readdir } from "fs/promises";
import { resolve, relative } from "path";

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  let files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files).filter((f) => !f.includes("cache"));
}

const generateFrontendManifest = async (rootPath) => {
  const output = [`module.exports = {`];
  let files = await getFiles(rootPath);
  for (const file of files) {
    const key = relative(rootPath, file);
    output.push(`  "${key}": require("${file}"),`);
  }
  output.push(`};`);
  return output.join("\n");
};

let frontendBundlePlugin = {
  name: "frontendBundle",
  setup(build) {
    build.onResolve({ filter: /.*frontend-stub$/ }, async (args) => {
      return {
        path: resolve(args.resolveDir, "..", "..", "www", "static-build"),
        namespace: "frontendBundle",
      };
    });

    // Any files from the static-build directory should be bundled as binary
    build.onLoad(
      { namespace: "frontendBundle", filter: /.*static\-build/ },
      async (args) => {
        return {
          contents: await generateFrontendManifest(args.path),
          loader: "js",
          resolveDir: resolve(args.resolveDir, args.path),
        };
      }
    );

    // Any files from the static-build directory should be bundled as binary
    build.onLoad({ filter: /.*static\-build.+/ }, async (args) => {
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
    outfile: "./dist-esbuild/livepeer-api",
    target: "node18",
    external: ["pg-native"],
    sourcemap: "inline",
    plugins: [frontendBundlePlugin],
    minify: true,
  });
})();
