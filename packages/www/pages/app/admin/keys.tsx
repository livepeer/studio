/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "hooks/use-api";
import Layout from "layouts/admin";
import useLoggedIn from "hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminTokenTable from "@components/Admin/AdminTokenTable";
import { getTabs } from "../admin";

const Keys = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user) {
    return <Layout />;
  }
  const tabs = getTabs(1);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminTokenTable id="Admin API Token Table" userId={user.id} />
    </TabbedLayout>
  );
};

export default Keys;
