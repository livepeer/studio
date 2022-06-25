export default {
  type: "object",
  name: "homeGuideSection",
  title: "Guide Section",
  fields: [
    {
      name: "Headline",
      title: "Headline",
      type: "string",
    },
    {
      title: "Guides",
      name: "guides",
      type: "array",
      of: [{ title: "Guide", type: "card" }],
    },
  ],
};
