import useApi from "../../hooks/use-api";
import Layout from "../../components/Layout";
import useLoggedIn from "../../hooks/use-logged-in";
import StreamsTable from "../../components/StreamsTable";
import TabbedLayout from "../../components/TabbedLayout";
import Tabs, { TabType } from "../../components/Tabs";

export function getTabs(i: number): Array<TabType> {
  const tabs: Array<TabType> = [
    {
      name: "Streams",
      href: "/app/user",
    },
    {
      name: "API Keys",
      href: "/app/user/keys",
    },
  ];
  return tabs.map((t, ti) => (ti === i ? { ...t, isActive: true } : t));
}

export default () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(0);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <StreamsTable id="Streams Table" userId={user.id} />
    </TabbedLayout>
  );
};
