import { BsTextCenter } from "react-icons/bs";
export default {
  name: "centerTitle",
  title: "Center Title",
  type: "object",
  icon: BsTextCenter,
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
    },
    {
      name: "portableText",
      title: "Portable Text",
      type: "portableText",
    },
  ],
};
