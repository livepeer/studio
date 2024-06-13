import Ajv from "ajv";
import pack from "ajv-pack";
import { safeLoad as parseYaml, safeDump as serializeYaml } from "js-yaml";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { compile as generateTypes } from "json-schema-to-typescript";
import $RefParser from "json-schema-ref-parser";

// This takes schema.yaml as its input and produces a few outputs.
// 1. types.d.ts, TypeScript definitions of the JSON-schema objects
// 2. the `validators` directory containing precompiled Ajv schemas for those objects
// 3. src/schema/schema.json and dist/schema/schema.json

const write = (dir, data) => {
  if (fs.existsSync(dir)) {
    const existing = fs.readFileSync(dir, "utf8");
    if (existing === data) {
      return;
    }
  }
  fs.writeFileSync(dir, data, "utf8");
  console.log(`wrote ${dir}`);
};

const schemaDir = path.resolve(__dirname, "schema");
const validatorDir = path.resolve(schemaDir, "validators");
const schemaDistDir = path.resolve(__dirname, "..", "dist", "schema");
fs.ensureDirSync(validatorDir);
fs.ensureDirSync(schemaDistDir);

const apiSchemaStr = fs.readFileSync(
  path.resolve(schemaDir, "api-schema.yaml"),
  "utf8",
);
const dbSchemaStr = fs.readFileSync(
  path.resolve(schemaDir, "db-schema.yaml"),
  "utf8",
);
const apiData = parseYaml(apiSchemaStr);
const dbData = parseYaml(dbSchemaStr);
const data = _.merge({}, apiData, dbData);

(async () => {
  const yaml = serializeYaml(data);
  write(path.resolve(schemaDir, "schema.yaml"), yaml);
  write(path.resolve(schemaDistDir, "schema.yaml"), yaml);

  await $RefParser.dereference({ components: data.components });

  const str = JSON.stringify(data, null, 2);
  write(path.resolve(schemaDir, "schema.json"), str);
  write(path.resolve(schemaDistDir, "schema.json"), str);

  const ajv = new Ajv({ sourceCode: true });

  const index = [];
  let types = [];

  for (const [name, schema] of Object.entries(data.components.schemas)) {
    schema.title = name;
    const type = await generateTypes(schema);
    types.push(type);
    var validate = ajv.compile(schema);
    var moduleCode = pack(ajv, validate);
    const outPath = path.resolve(validatorDir, `${name}.js`);
    write(outPath, moduleCode);
    index.push(`'${name}':  require('./${name}.js'),`);
  }

  const indexStr = `export default { ${index.join("\n")} }`;
  const indexPath = path.resolve(validatorDir, "index.js");
  write(indexPath, indexStr);

  const creatorIdTypeDefinition = `export type InputCreatorId =
  | {
      type: "unverified";
      value: string;
    }
  | string;`;

  const playbackPolicyTypeDefinition = "export type PlaybackPolicy1 = null;";
  const playbackPolicy2TypeDefinition =
    "export type PlaybackPolicy2 = PlaybackPolicy | PlaybackPolicy1;";

  let typeStr = types.join("\n\n");
  const cleanedTypeStr = typeStr
    .split(creatorIdTypeDefinition)
    .join("")
    .split(playbackPolicyTypeDefinition)
    .join("")
    .split(playbackPolicy2TypeDefinition)
    .join("");
  typeStr = `${cleanedTypeStr.trim()}\n\n${creatorIdTypeDefinition}\n\n${playbackPolicyTypeDefinition}\n\n${playbackPolicy2TypeDefinition}`;

  const typePath = path.resolve(schemaDir, "types.d.ts");
  write(typePath, typeStr);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
