import Layout from "../../../../layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import ApiKeysTable from "components/ApiKeys";
import { DashboardAPIKeys as Content } from "content";
import { useProjectContext } from "context/ProjectContext";

const ApiKeys = () => {
  useLoggedIn();
  const { user } = useApi();
  const { appendProjectId } = useProjectContext();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers"
      breadcrumbs={[
        {
          title: "Developers",
          href: appendProjectId("/developers/api-keys"),
        },
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
