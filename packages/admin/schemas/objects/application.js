export default {
  title: "App",
  name: "application",
  type: "object",
  fields: [
    {
      name: "name",
      type: "string",
      title: "Name",
    },
    {
      name: "description",
      type: "string",
      title: "Description",
    },
    {
      title: "Case Study",
      name: "caseStudy",
      type: "reference",
      description: "Locate a document you want to link to",
      to: [{ type: "post" }, { type: "route" }],
    },
  ],
};
