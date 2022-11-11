import PageTypes from "../PageTypes";

export default {
  name: "nextLink",
  title: "Link",
  type: "object",
  fields: [
    {
      name: "external",
      type: "url",
      title: "URL",
      hidden: ({ parent, value }: any) => !value && parent?.internal,
      validation: (Rule: any) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["http", "https", "mailto", "tel"],
        }),
    },
    {
      name: "internal",
      type: "reference",
      to: PageTypes,
      hidden: ({ parent, value }: any) => !value && parent?.external,
    },
  ],
};
