/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import Layout from "../../../layouts/admin";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminStreamsTable from "@components/Admin/AdminStreamsTable";
import { getTabs } from "../admin";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const AdminStreamsPage = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || (emailVerificationMode && user.emailValid === false)) {
    return <Layout />;
  }
  const tabs = getTabs(2);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminStreamsTable id="Admin API Token Table" />
    </TabbedLayout>
  );
};

export default AdminStreamsPage;
