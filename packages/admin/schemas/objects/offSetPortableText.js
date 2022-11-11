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
    // {
    //   name: "buttons",
    //   title: "Buttons",
    //   type: "array",
    //   of: [{ type: "button" }],
    // },
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
