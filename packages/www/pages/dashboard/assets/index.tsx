import Layout from "../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import AssetsTable from "@components/Dashboard/AssetsTable";
import { DashboardAssets as Content } from "content";

const Assets = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="assets"
      breadcrumbs={[{ title: "Assets" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <AssetsTable userId={user.id} tableId="dashboardAssetsTable" />
        </Box>
      </Box>
    </Layout>
  );
};

export default Assets;
