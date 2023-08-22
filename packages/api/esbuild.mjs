import esbuild from "esbuild";

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
  });
})();
