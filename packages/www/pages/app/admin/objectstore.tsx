/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "hooks/use-api";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import useLoggedIn from "hooks/use-logged-in";
import TabbedLayout from "@components/Admin/TabbedLayout";
import AdminObjectStoreTable from "@components/Admin/AdminObjectStoreTable";
import { getTabs } from "../admin";

const ObjectStore = () => {
  useLoggedIn();
  const { logout } = useApi();
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

export default withEmailVerifyMode(ObjectStore);
