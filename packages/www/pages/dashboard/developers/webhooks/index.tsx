import Layout from "layouts/dashboard";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import { Box } from "@livepeer.com/design-system";
import WebhooksTable from "components/Dashboard/WebhooksTable";

const ApiKeys = () => {
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

export default withEmailVerifyMode(ApiKeys);
