export default {
  title: "Card",
  name: "card",
  type: "object",
  fields: [
    {
      title: "Numeronym",
      name: "numeronym",
      type: "string",
    },
    {
      title: "Title",
      name: "title",
      type: "string",
    },
    {
      title: "Description",
      name: "description",
      type: "string",
    },
    {
      title: "Link",
      name: "link",
      type: "link",
    },
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: `${title}`,
      };
    },
  },
};
