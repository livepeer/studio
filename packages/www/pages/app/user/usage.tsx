import useApi from "../../../hooks/use-api";
import Layout from "../../../components/Layout";
import useLoggedIn from "../../../hooks/use-logged-in";
import TabbedLayout from "../../../components/TabbedLayout";
import { getTabs } from "../user";
import { Box, Flex, Container, Heading } from "@theme-ui/components";
import UpcomingInvoiceTable from "../../../components/UpcomingInvoiceTable";
import PastInvoicesTable from "../../../components/PastInvoicesTable";
import { useEffect, useState } from "react";
import { MdAllInclusive } from "react-icons/md";
import { products } from "@livepeer.com/api/src/config";

const Usage = () => {
  useLoggedIn();
  const { user, logout, getUsage, getSubscription, getInvoices } = useApi();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    const doGetInvoices = async (stripeCustomerId) => {
      const [res, invoices] = await getInvoices(stripeCustomerId);
      if (res.status == 200) {
        setInvoices(invoices);
      }
    };

    const doGetUsage = async (fromTime, toTime, userId) => {
      const [res, usage] = await getUsage(fromTime, toTime, userId);
      if (res.status == 200) {
        console.log(`got usage data:`, usage);
        setUsage(usage);
      }
    };
    const getSubscriptionAndUsage = async (subscriptionId) => {
      const [res, subscription] = await getSubscription(subscriptionId);
      if (res.status == 200) {
        setSubscription(subscription);
      }
      doGetUsage(
        subscription?.current_period_start,
        subscription?.current_period_end,
        user.id
      );
    };

    if (user) {
      doGetInvoices(user.stripeCustomerId);
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  const tabs = getTabs(3);
  return (
    <TabbedLayout tabs={tabs} logout={logout}>
      <Box
        sx={{
          textAlign: "center",
          width: "100%",
          pt: 5,
          pb: 5,
          borderColor: "muted"
        }}
      >
        <Container>
          <Heading as="h2" sx={{ fontSize: 5, mb: 2 }}>
            Usage
          </Heading>
          <Box sx={{ color: "offBlack" }}>
            A summary of your usage and invoices
          </Box>
        </Container>
      </Box>

      <Container>
        <Box
          sx={{
            textAlign: "center",
            mb: 4,
            fontSize: 1,
            textTransform: "uppercase"
          }}
        >
          {subscription && (
            <Box>
              {new Date(
                subscription.current_period_start * 1000
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}{" "}
              -{" "}
              {new Date(
                subscription.current_period_end * 1000
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}{" "}
            </Box>
          )}
        </Box>
        <Flex sx={{ mb: 5, justifyContent: "center", alignItems: "center" }}>
          <Flex
            sx={{
              flexDirection: "column",
              alignItems: "center",
              py: 3,
              px: 4
            }}
          >
            <Flex sx={{ alignItems: "center" }}>
              <Box sx={{ mr: 2, fontWeight: "500", fontSize: 5 }}>
                {usage &&
                  (usage.sourceSegmentsDuration / 60)
                    .toFixed(2)
                    .toLocaleString()}{" "}
                {products[user.stripeProductId].order > 0 && <span>min</span>}
              </Box>
              <Flex
                sx={{
                  alignItems: "center",
                  fontSize: 2,
                  color: "gray"
                }}
              >
                /
                {!products[user.stripeProductId].order ? (
                  <span sx={{ mt: "3px", ml: 2 }}>1,000 min</span>
                ) : (
                  <MdAllInclusive sx={{ mt: "3px", ml: 2 }} />
                )}
              </Flex>
            </Flex>
            <Box sx={{ fontSize: 1, color: "gray" }}>Transcoding</Box>
          </Flex>
          {/* <Flex
            sx={{
              flexDirection: "column",
              alignItems: "center",
              py: 3,
              px: 4,
              borderLeft: "1px solid",
              borderRight: "1px solid",
              borderColor: "muted"
            }}
          >
            <Flex sx={{ alignItems: "center" }}>
              <Box sx={{ mr: 2, fontWeight: "500", fontSize: 5 }}>X</Box>
              <Flex
                sx={{
                  alignItems: "center",
                  fontSize: 2,
                  color: "gray"
                }}
              >
                /
                <MdAllInclusive sx={{ mt: "3px", ml: 2 }} />
              </Flex>
            </Flex>
            <Box sx={{ fontSize: 1, color: "gray" }}>Storage</Box>
          </Flex>
          <Flex
            sx={{
              flexDirection: "column",
              alignItems: "center",
              py: 3,
              px: 4
            }}
          >
            <Flex sx={{ alignItems: "center" }}>
              <Box sx={{ mr: 2, fontWeight: "500", fontSize: 5 }}>X</Box>
              <Flex
                sx={{
                  alignItems: "center",
                  fontSize: 2,
                  color: "gray"
                }}
              >
                /
                <MdAllInclusive sx={{ mt: "3px", ml: 2 }} />
              </Flex>
            </Flex>
            <Box sx={{ fontSize: 1, color: "gray" }}>Streaming</Box>
          </Flex> */}
        </Flex>
        <Box sx={{ mb: 5 }}>
          <Box
            sx={{
              fontWeight: 600,
              textAlign: "center",
              mb: !products[user.stripeProductId].order ? 3 : 4
            }}
          >
            Upcoming Invoice
          </Box>
          {!products[user.stripeProductId].order ? (
            <Box
              sx={{
                maxWidth: 600,
                mx: "auto",
                textAlign: "center",
                color: "offBlack"
              }}
            >
              The Personal plan is free of charge up to 1000 minutes per month
              and limited to 10 concurrent viewers per account
            </Box>
          ) : (
            subscription && (
              <UpcomingInvoiceTable
                subscription={subscription}
                usage={usage}
                prices={products[user.stripeProductId].usage}
              />
            )
          )}
        </Box>
        {invoices?.data.filter((invoice) => invoice.lines.total_count > 1)
          .length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ fontWeight: 600, textAlign: "center", mb: 4 }}>
              Past Invoices
            </Box>
            <PastInvoicesTable invoices={invoices} />
          </Box>
        )}
      </Container>
    </TabbedLayout>
  );
};

export default Usage;
