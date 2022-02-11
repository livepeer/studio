export default {
  name: "product",
  type: "document",
  title: "Products",
  fieldsets: [
    {
      title: "SEO & metadata",
      name: "metadata",
    },
  ],
  initialValue: {
    includeInSitemap: true,
    disallowRobots: false,
  },
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title",
    },
    {
      title: "Slug",
      name: "slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 200, // will be ignored if slugify is set
        slugify: (input) =>
          input.toLowerCase().replace(/\s+/g, "-").slice(0, 200),
      },
    },
    { name: "hero", type: "hero", title: "Hero" },
    { name: "why", type: "why", title: "Why Livpeeer.com" },
    { name: "caseStudy", type: "caseStudy", title: "Case Study" },
    {
      name: "metaTitle",
      type: "string",
      title: "Title",
      description: "This title populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "metaDescription",
      type: "text",
      title: "Description",
      description: "This description populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "openGraphImage",
      type: "image",
      title: "Open Graph Image",
      description: "Image for sharing previews on Facebook, Twitter etc.",
      fieldset: "metadata",
    },
    {
      name: "metaUrl",
      type: "url",
      title: "URL",
      description: "This url populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "includeInSitemap",
      type: "boolean",
      title: "Include page in sitemap",
      description: "For search engines. Will be added to /sitemap.xml",
    },
    {
      name: "disallowRobots",
      type: "boolean",
      title: "Disallow in robots.txt",
      description: "Hide this route for search engines",
    },
  ],

  preview: {
    select: {
      title: "title",
      media: "openGraphImage",
    },
  },
};
