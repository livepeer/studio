export default {
  type: "object",
  name: "homeFeaturedAppSection",
  title: "Featured App Section",
  fields: [
    {
      name: "Headline",
      title: "Headline",
      type: "string",
    },
    {
      name: "description",
      title: "Description",
      type: "string",
    },
    {
      name: "apps",
      title: "Featured Apps",
      type: "array",
      of: [
        {
          type: "application",
        },
      ],
    },
  ],
};
