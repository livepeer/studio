import { useState } from "react";
import Link from "next/link";
import Layout from "../../layouts/dashboard";
import { Box, Button, useSnackbar } from "@livepeer.com/design-system";

import { products } from "@livepeer.com/api/src/config";

import GettingStarted from "components/Dashboard/GettingStarted";
import UsageSummary from "components/Dashboard/UsageSummary";
import StreamsTable from "components/Dashboard/StreamsTable";
import Spinner from "components/Dashboard/Spinner";
import Banner from "@components/Dashboard/Banner";

import { useLoggedIn, useApi } from "hooks";
import { Dashboard as Content } from "content";

const Dashboard = () => {
  const { user, verifyEmail } = useApi();
  const { emailValid } = user;

  const [loading, setLoading] = useState(false);
  const showPromo = !products[user.stripeProductId].order;
  const [openSnackbar] = useSnackbar();

  const resendVerificationEmail = async () => {
    setLoading(true);
    const res = await verifyEmail(user.email);
    setLoading(false);

    if (res.errors) {
      openSnackbar(`Errors: ${res.errors.join(", ")}`);
    } else {
      openSnackbar(
        `We've sent you a link to verify your email. Please check your inbox at ${res.email}`
      );
    }
  };

  return (
    <Box css={{ p: "$6" }}>
      {!emailValid && (
        <Banner
          title="Verify your Email"
          description="Verify to the account email, then we'll send you a link to verify
        your email."
          button={
            <Button
              as="a"
              size="2"
              css={{ cursor: "default" }}
              onClick={() => resendVerificationEmail()}>
              {loading && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Resend the verification email
            </Button>
          }
          css={{ mb: "$3" }}
        />
      )}
      {showPromo && (
        <Banner
          title="Upgrade to Pro"
          description="Upgrade to the Pro plan and enjoy unlimited transcoding and streaming minutes."
          button={
            <Link href="/dashboard/billing/plans" passHref>
              <Button as="a" size="2" css={{ cursor: "default" }}>
                Upgrade to Pro
              </Button>
            </Link>
          }
          css={{ mb: "$7" }}
        />
      )}
      <Box css={{ mb: "$9" }}>
        <GettingStarted firstName={user?.firstName} />
      </Box>
      <Box css={{ mb: "100px" }}>
        <UsageSummary />
      </Box>
      <Box css={{ mb: "$8" }}>
        <StreamsTable
          title="Streams"
          userId={user.id}
          pageSize={5}
          tableId="dashboardStreamsTable"
          viewAll="/dashboard/streams"
        />
      </Box>
    </Box>
  );
};

const DashboardPage = () => {
  useLoggedIn();

  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout id="home" breadcrumbs={[{ title: "Home" }]} {...Content.metaData}>
      <Dashboard />
    </Layout>
  );
};

export default DashboardPage;
