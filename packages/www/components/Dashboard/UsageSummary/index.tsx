import {
  Box,
  Heading,
  Badge,
  Flex,
  Grid,
  Link as A,
  styled,
  Skeleton,
  Text,
} from "@livepeer.com/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import UpcomingIcon from "../../../public/img/icons/upcoming.svg";
import { useEffect, useState } from "react";
import { useApi } from "hooks";
import { products } from "@livepeer.com/api/src/config";

const StyledUpcomingIcon = styled(UpcomingIcon, {
  mr: "$2",
  color: "$hiContrast",
});

const UsageCard = ({ title, usage, limit, loading = false }) => {
  return (
    <Box
      css={{
        px: "$5",
        py: "$4",
        boxShadow: "0 0 0 1px $colors$mauve6",
        borderRadius: "$1",
        backgroundColor: "$mauve2",
        color: "$hiContrast",
        mb: "$6",
        minHeight: 92,
      }}>
      {loading ? (
        <Box
          css={{
            display: "flex",
            fd: "column",
            gap: "$3",
          }}>
          <Skeleton variant="title" css={{ width: "50%" }} />
          <Skeleton variant="heading" css={{ width: "25%" }} />
        </Box>
      ) : (
        <>
          <Box css={{ mb: "$2", color: "$mauve9" }}>{title}</Box>
          <Flex align="center" css={{ fontSize: "$6" }}>
            <Box css={{ fontWeight: 700 }}>{usage}</Box>
            {limit && <Box css={{ mx: "$1" }}>/</Box>}
            {limit && <Box>{limit}</Box>}
          </Flex>
        </>
      )}
    </Box>
  );
};

const UsageSummary = () => {
  const { user, getUsage, getSubscription, getInvoices } = useApi();
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

  return (
    <>
      <Flex
        justify="between"
        align="end"
        css={{
          borderBottom: "1px solid",
          borderColor: "$mauve6",
          pb: "$4",
          mb: "$5",
          width: "100%",
        }}>
        <Heading size="2">
          <Flex>
            <Box
              css={{
                mr: "$3",
                fontWeight: 600,
                letterSpacing: "0",
              }}>
              Usage
            </Box>
            <Badge
              size="1"
              variant="violet"
              css={{ letterSpacing: 0, mt: "7px" }}>
              {user?.stripeProductId
                ? products[user.stripeProductId].name
                : products["prod_0"].name}{" "}
              Plan
            </Badge>
          </Flex>
        </Heading>
        <Flex css={{ fontSize: "$3", color: "$mauve9" }}>
          Current billing period (
          {subscription && (
            <Flex>
              {new Date(
                subscription.current_period_start * 1000
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              to{" "}
              {new Date(
                subscription.current_period_end * 1000
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
            </Flex>
          )}
          )
        </Flex>
      </Flex>
      <Grid gap="4" columns="3">
        <UsageCard
          title="Transcoding minutes"
          loading={!usage}
          usage={
            usage &&
            (usage.sourceSegmentsDuration / 60).toFixed(2).toLocaleString()
          }
          limit={!products[user.stripeProductId]?.order ? 1000 : false}
        />
      </Grid>
      <Flex
        justify="between"
        align="center"
        css={{ fontSize: "$3", color: "$hiContrast" }}>
        <Flex align="center">
          <StyledUpcomingIcon />
          Upcoming invoice: <Box css={{ ml: "$1", fontWeight: 600 }}>$0.00</Box>
        </Flex>
        <Link href="/dashboard/billing" passHref>
          <A variant="violet" css={{ display: "flex", alignItems: "center" }}>
            View billing <ArrowRightIcon />
          </A>
        </Link>
      </Flex>
    </>
  );
};

export default UsageSummary;
