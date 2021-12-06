import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { Box } from "@livepeer.com/design-system";
import WebhooksTable from "components/Dashboard/WebhooksTable";

const ApiKeys = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
        { title: "Developers", href: "/dashboard/developers/webhooks" },
        { title: "Webhooks" },
      ]}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <WebhooksTable />
        </Box>
      </Box>
    </Layout>
  );
};

export default ApiKeys;
