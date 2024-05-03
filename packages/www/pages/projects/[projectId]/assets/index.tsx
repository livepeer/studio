<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/assets/index.tsx
import Layout from "../../../../../layouts/dashboard";
========
import Layout from "../../layouts/dashboard";
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/assets/index.tsx
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
