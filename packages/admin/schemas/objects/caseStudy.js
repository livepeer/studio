export default {
  type: "object",
  name: "caseStudy",
  title: "Case Study",
  fieldsets: [
    {
      title: "Link",
      name: "link",
    },
  ],
  fields: [
    {
      name: "heading",
      type: "string",
      title: "Heading",
    },
    {
      name: "about",
      type: "text",
      title: "About",
      description: "A short blurb about what the company does",
      rows: 3,
    },
    {
      name: "image",
      type: "imageExtended",
      title: "Image",
      options: {
        hotspot: true,
        metadata: ["location", "palette"],
      },
    },
    {
      name: "problem",
      type: "text",
      title: "Problem",
      rows: 3,
    },
    {
      name: "solution",
      type: "text",
      title: "Solution",
      rows: 3,
    },
    {
      title: "Link",
      description: "Use this to link the case study article",
      name: "internalLink",
      type: "reference",
      to: [{ type: "post" }],
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
        subtitle: "Case Study",
        media,
      };
    },
  },
};
