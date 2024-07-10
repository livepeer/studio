import Layout from "../../../../layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import { DashboardSigningKeys as Content } from "content";
import SigningKeysTable from "components/SigningKeysTable";
import { useProjectContext } from "context/ProjectContext";

const SigningKeys = () => {
  useLoggedIn();
  const { user } = useApi();
  const { appendProjectId } = useProjectContext();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers/signing-keys"
      breadcrumbs={[
        {
          title: "Developers",
          href: appendProjectId("/developers/signing-keys"),
        },
        { title: "Signing Keys" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <SigningKeysTable tableId="dashboardSigningKeysTable" />
        </Box>
      </Box>
    </Layout>
  );
};

export default SigningKeys;
