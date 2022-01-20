const typeMap = {
  string: "str",
  boolean: undefined,
  number: "uint",
  array: "str",
};

enum MistOptionType {
  "str",
  "uint",
}

type MistOptional = {
  default?: string | boolean;
  help: string;
  name: string;
  option: string;
  short: string;
  type?: MistOptionType;
};

type MistConfig = {
  name: string;
  friendly: string;
  desc: string;
  optional: { [key: string]: MistOptional };
  version: string;
};

// Takes a Yargs `.options()` block and returns a Mist-compatible JSON exmplanations
export default function yargsToMist(options: any) {
  const pkg = require("../package.json");
  // const pkg = require("../package.json");
  const obj = <MistConfig>{
    name: "livepeer-api",
    friendly: "Livepeer API Server",
    desc: "Livepeer TypeScript API Server, backed by Postgres + RabbitMQ",
    optional: {},
    version: pkg.version,
  };
  for (const [flag, option] of Object.entries(options)) {
    const opt = option as any;
    const output = <MistOptional>{
      name: flag,
      option: `--${flag}`,
      default: opt.default,
      help: opt.describe,
    };
    obj.optional[flag] = output;
    if (!typeMap.hasOwnProperty(opt.type)) {
      throw new Error(`Type not found for ${opt.type}`);
    }
    output.type = typeMap[opt.type];
  }
  return obj;
}
