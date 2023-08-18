export const products = {
  prod_0: {
    deprecated: true,
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
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0,
        limit: 1_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0,
        limit: 1_000,
      },
    ],
    monthlyPrice: 0,
  },
  prod_1: {
    deprecated: true,
    order: 1,
    name: "Pro",
    lookupKeys: ["price_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
        limit: 3_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 100_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 10_000,
      },
    ],
    monthlyPrice: 0,
  },
  prod_2: {
    deprecated: true,
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
    monthlyPrice: 0,
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
        price: 0.0055,
        limit: 1_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 10_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 1_000,
      },
    ],
    monthlyPrice: 0,
  },
  growth_1: {
    order: 4,
    name: "Growth",
    lookupKeys: ["growth_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
        limit: 3_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 100_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 10_000,
      },
    ],
    monthlyPrice: 100,
    payAsYouGo: true,
  },
  scale_1: {
    order: 5,
    name: "Scale",
    lookupKeys: ["scale_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
        limit: 20_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 500_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 50_000,
      },
    ],
    monthlyPrice: 500,
    payAsYouGo: true,
  },
  pay_as_you_go_1: {
    order: 6,
    name: "Pay-As-You-Go",
    lookupKeys: ["transcoding_usage", "tstreaming_usage", "tstorage_usage"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
      },
    ],
    monthlyPrice: 0,
  },
  prod_4: {
    deprecated: true,
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
    monthlyPrice: 0,
  },
  prod_O9XuIjn7EqYRVW: {
    order: 8,
    name: "Hacker",
    lookupKeys: ["hacker_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
        limit: 1_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 10_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 1_000,
      },
    ],
    monthlyPrice: 0,
  },
  prod_O9XtHhI6rbTT1B: {
    order: 9,
    name: "Growth",
    lookupKeys: ["growth_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
        limit: 3_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 100_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 10_000,
      },
    ],
    monthlyPrice: 100,
    payAsYouGo: true,
  },
  prod_O9XtcfOSMjSD5L: {
    order: 10,
    name: "Scale",
    lookupKeys: ["scale_1"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
        limit: 20_000,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
        limit: 500_000,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
        limit: 50_000,
      },
    ],
    monthlyPrice: 500,
    payAsYouGo: true,
  },
  prod_O9XuWMU1Up6QKf: {
    order: 11,
    name: "Pay-As-You-Go",
    lookupKeys: ["transcoding_usage", "tstreaming_usage", "tstorage_usage"],
    usage: [
      {
        name: "Transcoding",
        description: "Transcoding (minutes)",
        price: 0.0055,
      },
      {
        name: "Delivery",
        description: "Delivery (minutes)",
        price: 0.0005,
      },
      {
        name: "Storage",
        description: "Storage (minutes)",
        price: 0.0035,
      },
    ],
    monthlyPrice: 0,
  },
  prod_OTTwpzjA4U8B2P: {
    order: 12,
    name: "Enterprise",
    lookupKeys: ["enterprise_plan_1"],
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
    monthlyPrice: 0,
  },
  prod_OTTbwpzxNLMNSh: {
    order: 13,
    name: "Enterprise",
    lookupKeys: ["enterprise_plan_1"],
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
    monthlyPrice: 0,
  },
};
