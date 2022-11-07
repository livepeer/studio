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
