// TODO: These need to be created elsewhere and imported by this project & Catalyst

export const domain = {
  name: "Livepeer Decentralized Video Protocol",
  version: "0.0.1",
  salt: "f8b3858ac49ca50b138587d5dace09bd102b9d24d2567d9a5cde2f6122810931",
};

export const types = {
  EIP712Domain: [
    {
      name: "name",
      type: "string",
    },
    {
      name: "version",
      type: "string",
    },
    {
      name: "salt",
      type: "string",
    },
  ],
  ChannelDefinition: [
    {
      name: "signer",
      type: "address",
    },
    {
      name: "time",
      type: "int64",
    },
    {
      name: "id",
      type: "string",
    },
    {
      name: "multistreamTargets",
      type: "MultistreamTarget[]",
    },
  ],
  MultistreamTarget: [
    {
      name: "url",
      type: "string",
    },
  ],
};
