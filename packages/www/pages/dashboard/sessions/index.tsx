import Layout from "layouts/dashboard";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import { Box } from "@livepeer.com/design-system";
import AllSessionsTable from "components/Dashboard/AllSessionsTable";

const Sessions = () => {
  return (
    <Layout id="streams/sessions" breadcrumbs={[{ title: "Sessions" }]}>
      <Box css={{ p: "$6" }}>
        <AllSessionsTable />
      </Box>
    </Layout>
  );
};

export default withEmailVerifyMode(Sessions);
