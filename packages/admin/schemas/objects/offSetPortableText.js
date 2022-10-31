import { BsTextareaT } from "react-icons/bs";
export default {
  name: "offsetPortableText",
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
      name: "richText",
      title: "Description",
      type: "text",
    },
  ],
};
