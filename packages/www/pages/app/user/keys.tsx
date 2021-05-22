import useApi from "../../../hooks/use-api";
import Layout from "../../../layouts";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "../../../components/TabbedLayout";
import TokenTable from "../../../components/TokenTable";
import { getTabs } from "../user";
import { Box, Container, Heading } from "@theme-ui/components";

export default () => {
  useLoggedIn();
  const { user, logout } = useApi();
  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const tabs = getTabs(1);

  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <Box sx={{ width: "100%", pt: 5, pb: 5, borderColor: "muted" }}>
        <Container>
          <Heading as="h2" sx={{ fontSize: 5, mb: 2 }}>
            API keys
          </Heading>
          <Box sx={{ color: "offBlack" }}>Manage your API keys</Box>
        </Container>
      </Box>
      <TokenTable id="API Token Table" userId={user.id} />
    </TabbedLayout>
  );
};
