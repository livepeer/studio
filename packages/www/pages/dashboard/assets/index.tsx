import Layout from "layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import AssetsTable from "components/Dashboard/AssetsTable";

const Assets = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout id="vod/assets" breadcrumbs={[{ title: "Assets" }]}>
      <Box
        css={{
          pb: "$9",
          px: "$6",
          pt: "$6",
          "@bp4": {
            p: "$6",
          },
        }}>
        <AssetsTable />
      </Box>
    </Layout>
  );
};

export default Assets;
