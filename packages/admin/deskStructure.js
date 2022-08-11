import S from "@sanity/desk-tool/structure-builder";
import {
  MdDashboard,
  MdSettings,
  MdWork,
  MdDescription,
  MdPerson,
  MdHome,
  MdApps,
} from "react-icons/md";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";

// We filter document types defined in structure to prevent
// them from being listed twice
const hiddenDocTypes = (listItem) =>
  !["page", "job", "route", "site-config"].includes(listItem.getId());

export default () =>
  S.list()
    .title("Site")
    .items([
      S.listItem()
        .title("Home")
        .icon(MdHome)
        .child(S.document().schemaType("home").documentId("home")),
      S.divider(),

      S.listItem()
        .title("Site config")
        .icon(MdSettings)
        .child(
          S.editor()
            .id("config")
            .schemaType("site-config")
            .documentId("global-config")
        ),
      S.listItem()
        .title("Pages")
        .icon(MdDashboard)
        .schemaType("page")
        .child(
          S.documentTypeList("page")
            .title("Pages")
            .filter(`_type == "page" && !(_id match 'es-ES')`)
            .canHandleIntent(S.documentTypeList("app").getCanHandleIntent())
        ),
      S.listItem()
        .title("Blog Posts")
        .icon(MdDescription)
        .schemaType("post")
        .child(S.documentTypeList("post").title("Blog Posts")),
      S.listItem()
        .title("Blog Categories")
        .icon(MdDescription)
        .schemaType("category")
        .child(S.documentTypeList("category").title("Categories")),
      S.listItem()
        .title("Authors")
        .icon(MdPerson)
        .schemaType("author")
        .child(S.documentTypeList("author").title("Authors")),
      S.listItem()
        .title(`App`)
        .icon(MdApps)
        .child(
          S.documentList()
            .title(`App`)
            .schemaType("app")
            .filter(`_type == "app" && !(_id match 'es-ES')`)
            .canHandleIntent(S.documentTypeList("app").getCanHandleIntent())
        ),
      S.listItem()
        .title("Use Cases")
        .icon(MdDescription)
        .schemaType("useCase")
        .child(S.documentTypeList("useCase").title("Use Cases")),
    ]);
