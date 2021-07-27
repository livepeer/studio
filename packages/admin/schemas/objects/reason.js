export default {
  title: "Reason",
  type: "object",
  name: "reason",
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title",
    },
    {
      name: "description",
      type: "text",
      title: "Description",
      rows: 3,
    },
    {
      title: "Icon",
      name: "icon",
      type: "iconPicker",
      options: {
        outputFormat: "react",
      },
    },
  ],
};
