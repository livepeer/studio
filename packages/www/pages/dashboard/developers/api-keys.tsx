import Layout from "../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import TokenTable from "components/Dashboard/TokenTable";
import { DashboardAPIkeys as Content } from "content";

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
          <TokenTable userId={user.id} />
        </Box>
      </Box>
    </Layout>
  );
};

export default ApiKeys;
