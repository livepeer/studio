import { GrTextWrap } from "react-icons/gr";

export default {
  name: "splitImage",
  title: "Split image",
  icon: GrTextWrap,
  type: "object",
  fields: [
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
    {
      name: "inverted",
      title: "Image orientation",
      description:
        "Image on left (keep toggle left), image on right (keep toggle right)",
      type: "boolean",
      initialValue: true,
    },
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
    // {
    //   name: "buttons",
    //   title: "Buttons",
    //   type: "array",
    //   of: [{ type: "buttons" }],
    // },
  ],
};
