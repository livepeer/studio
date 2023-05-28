// TODO: These need to be created elsewhere and imported by this project & Catalyst

export const domain = {
  name: "Livepeer Decentralized Video Protocol",
  version: "0.0.1",
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
