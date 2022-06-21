export default {
  widgets: [
    {
      name: "project-info",
      options: {
        data: [
          {
            title: "GitHub repo",
            value: "https://github.com/livepeer/livepeer.studio",
            category: "Code",
          },
          {
            title: "Frontend",
            value: "https://livepeer.studio",
            category: "apps",
          },
        ],
      },
    },
    { name: "project-users", layout: { height: "auto" } },
    {
      name: "document-list",
      options: {
        title: "Recently edited",
        order: "_updatedAt desc",
        limit: 10,
        types: ["page", "job"],
      },
      layout: { width: "medium" },
    },
  ],
};
