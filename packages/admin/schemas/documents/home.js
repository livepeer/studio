export default {
  name: "home",
  title: "Home",
  type: "document",
  fields: [
    {
      name: "heroSection",
      title: "Hero",
      type: "homeHeroSection",
    },
    {
      name: "toolkitSection",
      title: "Toolkit",
      type: "homeToolkitSection",
    },
    {
      name: "guideSection",
      title: "Guides",
      type: "homeGuideSection",
    },
    {
      name: "featuredAppSection",
      title: "Featured Apps",
      type: "homeFeaturedAppSection",
    },
    {
      name: "principlesSection",
      title: "Principles Section",
      type: "homePrinciplesSection",
    },
  ],
  preview: {
    select: {
      name: "name",
    },
    prepare: ({ name = "Home" }) => {
      return {
        title: name,
      };
    },
  },
};
