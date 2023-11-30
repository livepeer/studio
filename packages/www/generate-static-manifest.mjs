import { resolve, relative, dirname } from "path";
import { readdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

(async () => {
  const output = [`module.exports = {`];
  const staticDir = resolve(__dirname, "./static-build");
  let files = await getFiles(staticDir);
  files = files.map((file) => relative(staticDir, file));
  for (const file of files) {
    output.push(`  "${file}": require("./static-build/${file}"),`);
  }
  output.push(`};`);
  await writeFile(
    resolve(__dirname, "static-manifest.js"),
    output.join("\n"),
    "utf8"
  );
})();
