export default {
  name: "form",
  title: "Form",
  type: "object",
  fields: [
    {
      name: "region",
      description: "Take 'region' from the hubspot embed form e.g 'na1'",
      title: "Region",
      type: "string",
    },
    {
      name: "portalId",
      description: "Take 'portalId' from the hubspot embed form e.g '1234567'",
      title: "Portal ID",
      type: "string",
    },
    {
      name: "formId",
      description:
        "Take 'formId' from the hubspot embed form e.g '5b126bda-8612-4bdd-9j12-da3fc9fc0ce8'",
      title: "Form ID",
      type: "string",
    },
  ],
};
