import Layout from "../../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import WebhooksTable from "components/Dashboard/WebhooksTable";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const ApiKeys = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || (emailVerificationMode && user.emailValid === false)) {
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
