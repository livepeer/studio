import Layout from "../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import StreamsTable from "components/Dashboard/StreamsTable";
import { DashboardStream as Content } from "content";

const Streams = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  return (
    <Layout
      id="streams"
      breadcrumbs={[{ title: "Streams" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <StreamsTable
          title="Streams"
          userId={user.id}
          pageSize={20}
          tableId="streamsTable"
        />
      </Box>
    </Layout>
  );
};

export default Streams;
