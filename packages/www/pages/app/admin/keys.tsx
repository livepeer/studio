/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "hooks/use-api";
import useLoggedIn from "hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminTokenTable from "@components/Admin/AdminTokenTable";
import { getTabs } from "../admin";

const Keys = () => {
  useLoggedIn();
  const { user, logout } = useApi();

  const tabs = getTabs(1);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminTokenTable id="Admin API Token Table" userId={user.id} />
    </TabbedLayout>
  );
};

export default Keys;
