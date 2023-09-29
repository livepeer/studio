import Layout from "layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import ClipsTable from "components/ClipsTable";
import { DashboardClips as Content } from "content";

const Clips = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="assets/clips"
      breadcrumbs={[{ title: "Clips" }]}
      {...Content.metaData}>
      <Box
        css={{
          pb: "$9",
          px: "$6",
          pt: "$6",
          "@bp4": {
            p: "$6",
          },
        }}>
        <ClipsTable />
      </Box>
    </Layout>
  );
};

export default Clips;
