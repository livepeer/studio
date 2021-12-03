import Layout from "../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import AllSessionsTable from "components/Dashboard/AllSessionsTable";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const Sessions = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || (emailVerificationMode && user.emailValid === false)) {
    return <Layout />;
  }

  return (
    <Layout id="streams/sessions" breadcrumbs={[{ title: "Sessions" }]}>
      <Box css={{ p: "$6" }}>
        <AllSessionsTable />
      </Box>
    </Layout>
  );
};

export default Sessions;
