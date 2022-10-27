import { BsTextareaT } from "react-icons/bs";
export default {
  name: "offSetPortableText",
  title: "OffSet PortableText",
  type: "object",
  icon: BsTextareaT,
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "description",
      title: "Description",
      type: "portableText",
    },
    {
      name: "button",
      title: "Button",
      type: "object",
      fields: [
        {
          name: "outline",
          title: "Outline",
          type: "boolean",
          description: "Solid button (left) Outline button (right)",
          initialValue: false,
        },
        {
          name: "buttonText",
          title: "Button Text",
          type: "string",
        },
        {
          name: "url",
          title: "Url",
          type: "string",
        },
      ],
    },
    {
      name: "socials",
      title: "Socials",
      type: "array",
      of: [
        {
          name: "icon",
          title: "Icon",
          type: "string",
        },
      ],
    },
  ],
};
