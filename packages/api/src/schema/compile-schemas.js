const Ajv = require("ajv");
let ajvFormats = require("ajv-formats");
ajvFormats = ajvFormats && ajvFormats.default ? ajvFormats.default : ajvFormats;
let standaloneCode = require("ajv/dist/standalone");
standaloneCode =
  standaloneCode && standaloneCode.default
    ? standaloneCode.default
    : standaloneCode;
const fs = require("fs-extra");
const { safeLoad: parseYaml, safeDump: serializeYaml } = require("js-yaml");
const $RefParser = require("json-schema-ref-parser");
let generateTypes = require("json-schema-to-typescript");
generateTypes =
  generateTypes && generateTypes.compile
    ? generateTypes.compile
    : generateTypes;
const _ = require("lodash");
const path = require("path");

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

// Remove the title from the schema to avoid conflicts with the TypeScript type name
function removeAllTitles(schema) {
  if (schema.title) {
    delete schema.title;
  }

  if (schema.properties) {
    for (const key in schema.properties) {
      if (schema.properties[key]) {
        schema.properties[key] = removeAllTitles(schema.properties[key]);
      }
    }
  }

  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items = schema.items.map((item) => removeAllTitles(item));
    } else {
      schema.items = removeAllTitles(schema.items);
    }
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    schema.oneOf = schema.oneOf.map((item) => removeAllTitles(item));
  }

  return schema;
}

const schemaDir = path.resolve(__dirname, ".");
process.chdir(schemaDir);

const validatorDir = path.resolve(schemaDir, "validators");
const schemaDistDir = path.resolve(__dirname, "..", "dist", "schema");
fs.ensureDirSync(validatorDir);
fs.ensureDirSync(schemaDistDir);

const schemaFiles = ["api-schema.yaml", "ai-api-schema.yaml", "db-schema.yaml"];
const subSchemas = [];
for (const file of schemaFiles) {
  const schemaStr = fs.readFileSync(path.resolve(schemaDir, file), "utf8");
  const data = parseYaml(schemaStr);
  subSchemas.push(data);
}
const data = _.merge({}, ...subSchemas);

(async () => {
  const yaml = serializeYaml(data);
  write(path.resolve(schemaDir, "schema.yaml"), yaml);
  write(path.resolve(schemaDistDir, "schema.yaml"), yaml);

  await $RefParser.dereference({ components: data.components });

  const str = JSON.stringify(data, null, 2);
  write(path.resolve(schemaDir, "schema.json"), str);
  write(path.resolve(schemaDistDir, "schema.json"), str);

  let ajv = new Ajv({
    keywords: [
      ...["example", "minValue"], // OpenAPI keywords not supported by ajv
      ...["table", "index", "indexType", "unique"], // our custom keywords
    ],
    code: { source: true },
  });
  ajv = ajvFormats(ajv, ["binary", "uri"]);

  const index = [];
  let types = [];

  for (let [name, schema] of Object.entries(data.components.schemas)) {
    schema = removeAllTitles(schema);
    schema.title = name;
    const type = await generateTypes(schema);
    types.push(type);
    var validate = ajv.compile(schema);
    var moduleCode = standaloneCode(ajv, validate);
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
