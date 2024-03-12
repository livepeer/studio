import Layout from "../../../layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import ApiKeysTable from "components/ApiKeys";
import { DashboardAPIKeys as Content } from "content";
import Ripe, { categories, pages } from "lib/ripe";

Ripe.trackPage({
  category: categories.DASHBOARD,
  name: pages.API_KEY,
});

const ApiKeys = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers"
      breadcrumbs={[
        { title: "Developers", href: "/dashboard/developers/api-keys" },
        { title: "API Keys" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <ApiKeysTable userId={user.id} />
        </Box>
      </Box>
    </Layout>
  );
};

export default ApiKeys;
