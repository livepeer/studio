import Layout from "layouts/dashboard";
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import StreamsTable from "components/StreamsTable";
import { DashboardStreams as Content } from "content";

const Streams = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="streams"
      breadcrumbs={[{ title: "Streams" }]}
      {...Content.metaData}>
      <Box className="h-full p-6">
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
