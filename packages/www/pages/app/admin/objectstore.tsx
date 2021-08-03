/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "hooks/use-api";
import Layout from "layouts";
import useLoggedIn from "hooks/use-logged-in";
import TabbedLayout from "components/Admin/TabbedLayout";
import AdminObjectStoreTable from "components/Admin/AdminObjectStoreTable";
import { getTabs } from "../admin";

const ObjectStore = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(4);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <AdminObjectStoreTable
        id="Admin API Object Store Table"
        key="objectstore"
      />
    </TabbedLayout>
  );
};

export default ObjectStore;
