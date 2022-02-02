import Layout from "../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import MediaServerTable from "@components/Dashboard/MediaServerTable";
import { DashboardAPIkeys as Content } from "content";

const MediaServer = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers/media-server"
      breadcrumbs={[
        { title: "Developers", href: "/dashboard/developers/media-server" },
        { title: "Media Server" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <MediaServerTable />
        </Box>
      </Box>
    </Layout>
  );
};

export default MediaServer;
