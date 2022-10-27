import { TiImageOutline } from "react-icons/ti";
export default {
  name: "heroImage",
  title: "Hero image",
  icon: TiImageOutline,
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
      name: "image",
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
    },
  ],
};
