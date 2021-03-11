import useApi from "../../hooks/use-api";
import Layout from "../../components/Layout";
import useLoggedIn from "../../hooks/use-logged-in";
import StreamsTable from "../../components/StreamsTable";
import TabbedLayout from "../../components/TabbedLayout";
import { TabType } from "../../components/Tabs";
import { Box, Container, Heading } from "@theme-ui/components";

export function getTabs(i: number): Array<TabType> {
  let tabs: Array<TabType> = [
    {
      name: "Streams",
      href: "/app/user",
    },
    {
      name: "API Keys",
      href: "/app/user/keys",
    },
    {
      name: "Test Player",
      href: "/app/test-player",
    },
    {
      name: "Usage",
      href: "/app/user/usage",
    },
    {
      name: "Plans",
      href: "/app/user/plans",
    },
  ];

  // hide tabs that interact with stripe if it's not enabled in dev mode
  if (
    process.env.NODE_ENV === "development" &&
    !process.env.NEXT_PUBLIC_STRIPE_ENABLED_IN_DEV_MODE
  ) {
    tabs = [
      {
        name: "Streams",
        href: "/app/user",
      },
      {
        name: "API Keys",
        href: "/app/user/keys",
      },
      {
        name: "Test Player",
        href: "/app/test-player",
      },
    ];
  }

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
      <Box sx={{ width: "100%", pt: 5, pb: 5, borderColor: "muted" }}>
        <Container>
          <Heading as="h2" sx={{ fontSize: 5, mb: 2 }}>
            Streams
          </Heading>
          <Box sx={{ color: "offBlack" }}>Manage your streams</Box>
        </Container>
      </Box>
      <StreamsTable id="Streams Table" userId={user.id} />
    </TabbedLayout>
  );
};
