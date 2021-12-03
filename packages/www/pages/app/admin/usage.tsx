/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "../../../hooks/use-api";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminUsageTable from "@components/Admin/AdminUsageTable";
import { getTabs } from "../admin";

const Usage = () => {
  useLoggedIn();
  const { logout } = useApi();
  const tabs = getTabs(5);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminUsageTable id="Admin API Usage Table" key="usage" />
    </TabbedLayout>
  );
};

export default withEmailVerifyMode(Usage);
