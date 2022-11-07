import { GrTextWrap } from "react-icons/gr";

export default {
  name: "splitImage",
  title: "Split image",
  icon: GrTextWrap,
  type: "object",
  fields: [
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
      type: "text",
    },
    {
      name: "portableText",
      title: "Portable Text",
      type: "portableText",
    },
    {
      name: "defaultImage",
      title: "Image",
      type: "defaultImage",
    },
  ],
};
