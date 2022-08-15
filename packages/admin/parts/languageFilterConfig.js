export default {
  supportedLanguages: [
    { id: "en", title: "English" },
    { id: "es", title: "Spanish" },
    //...
  ],
  defaultLanguages: ["en", "es"],
  documentTypes: ["site-config"],
  filterField: (enclosingType, field, selectedLanguageIds) =>
    !enclosingType.name.startsWith("locale") ||
    selectedLanguageIds.includes(field.name),
};
