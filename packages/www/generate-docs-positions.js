const globby = require("globby");
const fs = require("fs");
async function main() {
  const filePaths = await globby("docs/**/*");
  fs.writeFileSync(
    "./docs-positions.ts",
    `export const docsPositions = ${JSON.stringify(filePaths)}`
  );
}
main();
