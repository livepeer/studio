import { isSlugUnique } from "@sanity/document-internationalization/lib/validators";

export default {
  name: "page",
  type: "document",
  title: "Page",
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
        isUnique: isSlugUnique,
        slugify: (input) =>
          input.toLowerCase().replace(/\s+/g, "-").slice(0, 200),
      },
    },
    {
      name: "content",
      type: "array",
      title: "Page sections",
      of: [
        { type: "hero" },
        { type: "valuesSection" },
        { type: "investorsSection" },
        { type: "testimonialsSection" },
        { type: "contactSection" },
        { type: "ctaSection" },
        { type: "textSection" },
        { type: "markdownSection" },
        { type: "teamSection" },
        { type: "jobsSection" },
      ],
    },
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
