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
      type: "text",
    },
    {
      name: "icons",
      title: "Icons",
      type: "array",
      of: [{ type: "defaultImage" }],
    },
  ],
};
