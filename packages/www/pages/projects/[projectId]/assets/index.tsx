import Layout from "../../../../layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import AssetsTable from "components/AssetsTable";
import { DashboardAssets as Content } from "content";

const Assets = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  const data = {
    disableSizeLimit: true,
  };
  return (
    <Layout
      id="assets"
      breadcrumbs={[{ title: "Assets" }]}
      {...Content.metaData}>
      <Box className="h-full p-6">
        <Box className="mb-8 h-full">
          <AssetsTable userId={user.id} tableId="dashboardAssetsTable" />
        </Box>
      </Box>
    </Layout>
  );
};

export default Assets;
