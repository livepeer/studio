/** @jsx jsx */
import { jsx } from "theme-ui";
import useApi from "hooks/use-api";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import useLoggedIn from "hooks/use-logged-in";
import UserTable from "@components/Admin/UserTable";
import TabbedLayout from "@components/Admin/TabbedLayout";
import { TabType } from "@components/Admin/Tabs";

export function getTabs(i: number): Array<TabType> {
  const tabs = [
    {
      name: "Users",
      href: "/app/admin",
      isActive: false,
    },
    {
      name: "API Keys",
      href: "/app/admin/keys",
      isActive: false,
    },
    {
      name: "Streams",
      href: "/app/admin/streams",
      isActive: false,
    },
    {
      name: "Webhooks",
      href: "/app/admin/webhooks",
      isActive: false,
    },
    {
      name: "Object Store",
      href: "/app/admin/objectstore",
      isActive: false,
    },
    {
      name: "Usage",
      href: "/app/admin/usage",
      isActive: false,
    },
    {
      name: "Tools",
      href: "/app/admin/tools",
      isActive: false,
    },
  ];
  return tabs.map((t, ti) => (ti === i ? { ...t, isActive: true } : t));
}

const AdminPage = () => {
  useLoggedIn();
  const { user, logout } = useApi();
  const tabs = getTabs(0);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <UserTable id="User Table" userId={user.id} />
    </TabbedLayout>
  );
};

export default withEmailVerifyMode(AdminPage);
