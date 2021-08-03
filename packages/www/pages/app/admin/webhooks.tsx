/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import Layout from "../../../layouts/admin";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminWebhooksTable from "@components/Admin/AdminWebhooksTable";
import { getTabs } from "../admin";

export default () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(3);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminWebhooksTable id="Admin API Webhooks Table" key="webhooks" />
    </TabbedLayout>
  );
};
