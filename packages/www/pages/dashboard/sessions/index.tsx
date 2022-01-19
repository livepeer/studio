import Layout from "layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import AllSessionsTable from "components/Dashboard/AllSessionsTable";

const Sessions = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout id="streams/sessions" breadcrumbs={[{ title: "Sessions" }]}>
      <Box
        css={{
          pb: "$9",
          px: "$6",
          pt: "$6",
          "@bp4": {
            p: "$6",
          },
        }}>
        <AllSessionsTable />
      </Box>
    </Layout>
  );
};

export default Sessions;
