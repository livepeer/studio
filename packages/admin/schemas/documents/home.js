export default {
  name: "home",
  title: "Home",
  type: "document",
  i18n: true,
  initialValue: {
    __i18n_lang: "en-US",
  },
  i18n: {
    base: "en-US",
    languages: ["en-US", "es-ES"],
    fieldNames: {
      lang: "__i18n_lang",
      references: "__i18n_refs",
      baseReference: "__i18n_base",
    },
  },
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
