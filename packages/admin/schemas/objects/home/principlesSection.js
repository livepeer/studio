export default {
  type: "object",
  name: "homePrinciplesSection",
  title: "Principles Section",
  fields: [
    {
      name: "heading",
      title: "Heading",
      type: "string",
    },
    {
      name: "body",
      title: "Body",
      type: "string",
    },
    {
      name: "principles",
      title: "Principles",
      type: "array",
      of: [{ type: "string" }],
    },
  ],
};
