import Layout from "../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import GettingStarted from "@components/Dashboard/GettingStarted";
import UsageSummary from "@components/Dashboard/UsageSummary";
import StreamsTable from "@components/Dashboard/StreamsTable";
import SessionsTable from "@components/Dashboard/SessionsTable";
import { useLoggedIn, useApi } from "hooks";
import { Stream } from "@livepeer.com/api";

const Dashboard = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  return (
    <Layout>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <GettingStarted />
        </Box>
        <Box css={{ mb: "$9" }}>
          <UsageSummary />
        </Box>
        <Box css={{ mb: "$8" }}>
          <StreamsTable id="Streams Table" userId={user.id} />
        </Box>
        <Box css={{ mb: "$8" }}>
          {/* <SessionsTable streamId={stream.id} /> */}
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;
