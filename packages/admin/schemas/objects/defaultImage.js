export default {
  name: "defaultImage",
  title: "Image",
  type: "image",
  validation: (Rule) => Rule.required(),
  fields: [
    {
      name: "alt",
      type: "string",
      title: "Alt Text",
      options: {
        isHighlighted: true,
      },
    },
  ],
};
