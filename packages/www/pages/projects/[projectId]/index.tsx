import { useState } from "react";
import Link from "next/link";
import Layout from "../../../layouts/dashboard";
import { Box, Button, useSnackbar } from "@livepeer/design-system";
import GettingStarted from "components/GettingStarted";
import UsageSummary from "components/UsageSummary";
import StreamsTable from "components/StreamsTable";
import Spinner from "components/Spinner";
import Banner from "components/Banner";

import { useLoggedIn, useApi } from "hooks";
import { Dashboard as Content } from "content";
import FeaturesModel from "components/FeaturesModel";

const Dashboard = () => {
  const { user, verifyEmail, getUserProduct } = useApi();
  const { emailValid } = user;

  const [loading, setLoading] = useState(false);
  const [shouldShowFeature, setShouldShowFeature] = useState(false);
  const product = getUserProduct(user);
  const showPromo = user.disabled;
  const [openSnackbar] = useSnackbar();

  const resendVerificationEmail = async () => {
    setLoading(true);
    const res = await verifyEmail(user.email);
    setLoading(false);

    if (res.errors) {
      openSnackbar(`Errors: ${res.errors.join(", ")}`);
    } else {
      openSnackbar(
        `We've sent you a link to verify your email. Please check your inbox at ${user.email}`
      );
    }
  };

  return (
    <Box css={{ p: "$6" }}>
      {!emailValid && (
        <Banner
          title="Verify your email"
          description="Verify your account with a link via email."
          button={
            <Button
              variant="primary"
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
          title="Upgrade"
          description="Your free tier usage limit has been reached or we were unable to process your payment. Upgrade to our Growth or Scale plans or update your payment method to continue using Livepeer Studio."
          button={
            <Link href="/dashboard/billing/plans" passHref legacyBehavior>
              <Button
                variant="primary"
                as="a"
                size="2"
                css={{ cursor: "default" }}>
                Upgrade
              </Button>
            </Link>
          }
          css={{ mb: "$7" }}
        />
      )}
      <Box css={{ mb: "$6" }}>
        <GettingStarted firstName={user?.firstName} />
      </Box>

      <FeaturesModel />
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
