export default {
  name: "button",
  title: "Button",
  type: "object",
  fields: [
    // {
    //   name: "outline",
    //   title: "Outline",
    //   type: "boolean",
    //   description: "Solid button (left) Outline button (right)",
    //   initialValue: false,
    // },
    {
      name: "buttonText",
      title: "Button Text",
      type: "string",
    },
    {
      name: "url",
      title: "Url",
      type: "nextLink",
    },
  ],
};
