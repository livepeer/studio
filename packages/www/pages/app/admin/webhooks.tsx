/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import Layout from "../../../layouts/admin";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminWebhooksTable from "@components/Admin/AdminWebhooksTable";
import { getTabs } from "../admin";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const Webhooks = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || (emailVerificationMode && user.emailValid === false)) {
    return <Layout />;
  }
  const tabs = getTabs(3);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminWebhooksTable id="Admin API Webhooks Table" key="webhooks" />
    </TabbedLayout>
  );
};

export default Webhooks;
