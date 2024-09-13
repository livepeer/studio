import fs from "fs-extra";
import { safeLoad as parseYaml, safeDump as serializeYaml } from "js-yaml";
import path from "path";

// This downloads the AI schema from the AI worker repo and saves in the local
// ai-api-schema.yaml file, referenced by our main api-schema.yaml file.

const defaultModels = {
  "text-to-image": "SG161222/RealVisXL_V4.0_Lightning",
  "image-to-image": "timbrooks/instruct-pix2pix",
  "image-to-video": "stabilityai/stable-video-diffusion-img2vid-xt-1-1",
  upscale: "stabilityai/stable-diffusion-x4-upscaler",
  "audio-to-text": "openai/whisper-large-v3",
};
const schemaDir = path.resolve(__dirname, ".");
const aiSchemaUrl =
  "https://raw.githubusercontent.com/livepeer/ai-worker/refs/heads/main/runner/gateway.openapi.yaml";

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

const mapObject = (obj, fn) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => fn(key, value)),
  );
};

const downloadAiSchema = async () => {
  // download the file
  const response = await fetch(aiSchemaUrl);
  const data = await response.text();
  const schema = parseYaml(data);

  // remove info and servers fields
  delete schema.info;
  delete schema.servers;

  // patches to the paths section
  schema.paths = mapObject(schema.paths, (path, value) => {
    // prefix paths with /api/beta/generate
    path = `/api/beta/generate${path}`;
    // remove security field
    delete value.security;
    // add $ref: "#/components/schemas/error" as oneOf to all of the error responses
    const apiError = () => ({ $ref: "#/components/schemas/error" });
    value.post.responses = mapObject(
      value.post.responses,
      (statusCode, response) => {
        if (
          statusCode !== "default" &&
          Math.floor(parseInt(statusCode) / 100) === 2
        ) {
          return [statusCode, response];
        }
        response.content["application/json"].schema = {
          oneOf: [response.content["application/json"].schema, apiError()],
        };
        return [statusCode, response];
      },
    );
    // add $ref: "#/components/schemas/error" as the default response
    if (!value.post.responses["default"]) {
      value.post.responses["default"] = {
        description: "Error",
        content: { "application/json": { schema: apiError() } },
      };
    }
    return [path, value];
  });

  // Add default model_id to params objects
  schema.components.schemas = mapObject(
    schema.components.schemas,
    (key, value) => {
      let pipelineName;
      if (key.endsWith("Params")) {
        pipelineName = key.slice(0, -6);
      } else if (key.startsWith("Body_gen")) {
        pipelineName = key.slice(8);
      } else {
        return [key, value];
      }
      // turn CamelCase to kebab-case
      pipelineName = pipelineName
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase();

      if (pipelineName in defaultModels && value.properties.model_id) {
        value.properties.model_id.default = defaultModels[pipelineName];
      }
      return [key, value];
    },
  );

  const yaml = serializeYaml(schema);
  write(path.resolve(schemaDir, "ai-api-schema.yaml"), yaml);
};

downloadAiSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
