/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import Layout from "../../../layouts";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminUsageTable from "@components/Admin/AdminUsageTable";
import { getTabs } from "../admin";

const Usage = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(5);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminUsageTable id="Admin API Usage Table" key="usage" />
    </TabbedLayout>
  );
};

export default Usage;
