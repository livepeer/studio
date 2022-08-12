import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";

export default {
  name: "app",
  type: "document",
  orderings: [orderRankOrdering],
  title: "App",
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
    orderRankField({ type: "app" }),
    {
      name: "name",
      type: "string",
      title: "Name",
    },
    {
      name: "description",
      type: "string",
      title: "Description",
    },
    {
      title: "Case Study",
      name: "caseStudy",
      type: "reference",
      description: "Locate a document you want to link to",
      to: [{ type: "post" }, { type: "route" }],
    },
  ],
};
