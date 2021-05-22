import useApi from "../../../hooks/use-api";
import Layout from "../../../layouts";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "../../../components/TabbedLayout";
import AdminTools from "../../../components/AdminTools";
import { getTabs } from "../admin";

const ToolsPage = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(6);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminTools id="Admin API Tools" key="tools" />
    </TabbedLayout>
  );
};
export default ToolsPage;
