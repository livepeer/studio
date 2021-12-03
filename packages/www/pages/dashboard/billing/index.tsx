import Layout from "layouts/dashboard";
import { withEmailVerifyMode } from "layouts/withEmailVerifyMode";
import { useApi, useLoggedIn } from "hooks";
import {
  Box,
  Heading,
  Badge,
  Flex,
  Text,
  Link as A,
} from "@livepeer.com/design-system";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { products } from "@livepeer.com/api/src/config";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import PaymentMethodDialog from "components/Dashboard/PaymentMethodDialog";
import PaymentMethod from "components/Dashboard/PaymentMethod";
import UpcomingInvoiceTable from "components/Dashboard/UpcomingInvoiceTable";
import PastInvoicesTable from "components/Dashboard/PastInvoicesTable";
import { useQuery, useQueryClient } from "react-query";
import { DashboardBilling as Content } from "content";

const Billing = () => {
  useLoggedIn();
  const { user, getUsage, getSubscription, getInvoices, getPaymentMethod } =
    useApi();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);

  const fetcher = useCallback(async () => {
    if (user?.stripeCustomerPaymentMethodId) {
      const [_res, paymentMethod] = await getPaymentMethod(
        user.stripeCustomerPaymentMethodId
      );
      return paymentMethod;
    }
  }, [user?.stripeCustomerPaymentMethodId]);

  const queryKey = useMemo(() => {
    return [user?.stripeCustomerPaymentMethodId];
  }, [user?.stripeCustomerPaymentMethodId]);

  const { data, isLoading } = useQuery([queryKey], () => fetcher());

  const queryClient = useQueryClient();

  const invalidateQuery = useCallback(() => {
    return queryClient.invalidateQueries(queryKey);
  }, [queryClient, queryKey]);

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
    <Layout
      id="billing"
      breadcrumbs={[{ title: "Billing" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$7" }}>
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
                  Billing
                </Box>
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
        </Box>
        <Box css={{ mb: "$8" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$mauve6",
              pb: "$3",
              mb: "$4",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Current Plan
                </Box>
              </Flex>
            </Heading>
          </Flex>
          <Flex
            justify="between"
            align="center"
            css={{ fontSize: "$3", color: "$hiContrast" }}>
            <Text variant="gray">
              You are currently on the
              <Badge
                size="1"
                variant="violet"
                css={{ mx: "$1", fontWeight: 700, letterSpacing: 0 }}>
                {user?.stripeProductId
                  ? products[user.stripeProductId].name
                  : products["prod_0"].name}
              </Badge>
              plan.
            </Text>
            <Link href="/dashboard/billing/plans" passHref>
              <A
                variant="violet"
                css={{ display: "flex", alignItems: "center" }}>
                View Plans & Upgrade <ArrowRightIcon />
              </A>
            </Link>
          </Flex>
        </Box>
        <Box css={{ mb: "$9" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$mauve6",
              pb: "$3",
              mb: "$5",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center" justify="between">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Payment Method
                </Box>
              </Flex>
            </Heading>
            <PaymentMethodDialog invalidateQuery={invalidateQuery} />
          </Flex>
          <Flex
            css={{
              ".rccs__card__background": {
                background:
                  "linear-gradient(to right, $colors$violet11, $colors$indigo11) !important",
              },
              ".rccs__card--front": {
                color: "white !important",
              },
            }}>
            {user?.stripeCustomerPaymentMethodId ? (
              <>
                <PaymentMethod data={data} />
              </>
            ) : (
              "No payment method on file."
            )}
          </Flex>
        </Box>
        <Box css={{ mb: "$9" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              mb: "$4",
              width: "100%",
            }}>
            <Heading size="1">
              <Flex align="center">
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Upcoming Invoice
                </Box>
              </Flex>
            </Heading>
          </Flex>
          {!products[user.stripeProductId].order ? (
            <Text variant="gray">
              The Personal plan is free of charge up to 1000 minutes per month
              and limited to 10 concurrent viewers per account.
            </Text>
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
          <Box css={{ mb: "$6" }}>
            <Flex
              justify="between"
              align="end"
              css={{
                mb: "$4",
                width: "100%",
              }}>
              <Heading size="1">
                <Flex align="center">
                  <Box
                    css={{
                      mr: "$3",
                      fontWeight: 600,
                      letterSpacing: "0",
                    }}>
                    Past Invoices
                  </Box>
                </Flex>
              </Heading>
            </Flex>
            <PastInvoicesTable invoices={invoices} />
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default withEmailVerifyMode(Billing);
