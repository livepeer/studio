/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminWebhooksTable from "@components/Admin/AdminWebhooksTable";
import { getTabs } from "../admin";

const Webhooks = () => {
  useLoggedIn();
  const { logout } = useApi();
  const tabs = getTabs(3);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminWebhooksTable id="Admin API Webhooks Table" key="webhooks" />
    </TabbedLayout>
  );
};

export default Webhooks;
