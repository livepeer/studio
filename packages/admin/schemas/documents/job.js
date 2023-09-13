export default {
  name: "job",
  type: "document",
  title: "Job",
  fieldsets: [
    {
      title: "SEO & metadata",
      name: "metadata",
    },
  ],
  fields: [
    {
      name: "title",
      type: "string",
      title: "Job Title",
    },
    {
      name: "slug",
      type: "slug",
      title: "Slug",
      options: {
        source: "title",
        maxLength: 96,
      },
    },
    {
      name: "body",
      type: "markdown",
      title: "Body",
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
      name: "metaUrl",
      type: "url",
      title: "URL",
      description: "This url populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "openGraphImage",
      type: "image",
      title: "Open Graph Image",
      description: "Image for sharing previews on Facebook, Twitter etc.",
      fieldset: "metadata",
    },
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug",
    },
    prepare({ title = "No title" }) {
      return {
        title,
      };
    },
  },
};
