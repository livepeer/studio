import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import {
  Box,
  Heading,
  Badge,
  Flex,
  Text,
  Link as A,
} from "@livepeer/design-system";
import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import { products } from "@livepeer.studio/api/src/config";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import PaymentMethodDialog from "components/PaymentMethodDialog";
import PaymentMethod from "components/PaymentMethod";
import UpcomingInvoiceTable from "components/UpcomingInvoiceTable";
import PastInvoicesTable from "components/PastInvoicesTable";
import { useQuery, useQueryClient } from "react-query";
import { DashboardBilling as Content } from "content";

const Billing = () => {
  useLoggedIn();
  const {
    user,
    getUsage,
    getBillingUsage,
    getSubscription,
    getInvoices,
    getPaymentMethod,
  } = useApi();
  const [usage, setUsage] = useState(null);
  const [billingUsage, setBillingUsage] = useState(null);
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

    const doGetBillingUsage = async () => {
      // Gather current month data
      const now = new Date();
      const fromTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const toTime = now.getTime();

      const [res, usage] = await getBillingUsage(fromTime, toTime);
      if (res.status == 200) {
        setBillingUsage(usage);
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
      doGetBillingUsage();
    };

    if (user) {
      doGetInvoices(user.stripeCustomerId);
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  if (!user) {
    return <Layout />;
  }
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
              borderColor: "$neutral6",
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
            <Flex css={{ fontSize: "$3", color: "$hiContrast" }}>
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
              borderColor: "$neutral6",
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
            <Text variant="neutral">
              You are currently on the
              <Badge
                size="1"
                variant="neutral"
                css={{ mx: "$1", fontWeight: 700, letterSpacing: 0 }}>
                {user?.stripeProductId
                  ? products[user.stripeProductId]?.name
                  : products["prod_0"]?.name}
              </Badge>
              plan.
            </Text>
            <Link href="/dashboard/billing/plans" passHref legacyBehavior>
              <A
                variant="primary"
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
              borderColor: "$neutral6",
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
                  "linear-gradient(to right, $colors$green11, $colors$green11) !important",
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
                  Usage
                </Box>
              </Flex>
            </Heading>
          </Flex>
          <Text variant="neutral">Usage Month to date</Text>
          {billingUsage && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "Arial, sans-serif",
              }}>
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    DeliveryUsageGbs
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    TotalUsageMins
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    StorageUsageMins
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    {billingUsage.DeliveryUsageGbs}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    {billingUsage.TotalUsageMins}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    {billingUsage.StorageUsageMins}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
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
            <Text variant="neutral">
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

export default Billing;
