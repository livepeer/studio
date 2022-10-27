import { GrAggregate } from "react-icons/gr";

export default {
  name: "iconGrid",
  title: "Icon Grid",
  icon: GrAggregate,
  type: "object",
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "richText",
      title: "Rich Text",
      type: "portableText",
    },
    {
      name: "icons",
      title: "Icons",
      type: "array",
      of: [
        {
          name: "icon",
          title: "Icon",
          type: "object",
          fields: [
            {
              name: "iconImage",
              title: "Icon Image",
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
            },
            { name: "iconTitle", title: "Icon Title", type: "string" },
          ],
        },
      ],
    },
  ],
};
