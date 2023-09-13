export default {
  type: "object",
  name: "why",
  title: "Why Livepeer.com",
  fields: [
    {
      name: "heading",
      type: "string",
      title: "Heading",
    },
    {
      name: "reasons",
      type: "array",
      title: "Reasons",
      of: [
        {
          title: "Reason",
          type: "reason",
        },
      ],
    },
  ],
  preview: {
    select: {
      title: "heading",
      media: "image",
    },
    prepare({ title, media }) {
      return {
        title,
        subtitle: "Why Livepeer.com",
        media,
      };
    },
  },
};
