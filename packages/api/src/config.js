exports.products = {
  prod_0: {
    order: 0,
    name: "Personal",
    lookupKeys: ["price_0"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0,
        limit: 1_000,
      },
    ],
  },
  prod_1: {
    order: 1,
    name: "Pro",
    lookupKeys: ["price_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.005,
        limit: 3_000,
      },
    ],
  },
  prod_2: {
    order: 2,
    name: "Business",
    lookupKeys: ["price_2"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0,
      },
    ],
  },
  hacker_1: {
    order: 3,
    name: "Hacker",
    lookupKeys: ["hacker_1"],
    price: 0,
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0,
        limit: 1_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0,
        limit: 1_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0,
        limit: 1_000,
      },
    ],
  },
  growth_1: {
    order: 4,
    name: "Growth",
    lookupKeys: ["growth_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0,
        limit: 3_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0,
        limit: 100_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0,
        limit: 10_000,
      },
    ],
  },
  scale_1: {
    order: 5,
    name: "Scale",
    lookupKeys: ["scale_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0,
        limit: 20_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0,
        limit: 500_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0,
        limit: 50_000,
      },
    ],
  },
  pay_as_you_go_1: {
    order: 6,
    name: "Pay-As-You-Go",
    lookupKeys: ["transcoding_usage", "tstreaming_usage", "tstorage_usage"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.005,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0004,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.003,
      },
    ],
  },
  prod_4: {
    order: 7,
    name: "Enterprise",
    lookupKeys: ["enterprise_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0,
      },
    ],
  },
};
