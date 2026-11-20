import {
  Box,
  Heading,
  Badge,
  Flex,
  Grid,
  Link as A,
  Text,
  styled,
  Skeleton,
  Tooltip,
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import UpcomingIcon from "../../public/img/icons/upcoming.svg";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "hooks";
import { products } from "@livepeer.studio/api/src/config";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";
import { useJune, events } from "hooks/use-june";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";

export interface OverUsageBill {
  transcodingBill: OverUsageItem;
  deliveryBill: OverUsageItem;
  storageBill: OverUsageItem;
}

export interface OverUsageItem {
  units: number;
  total: number;
}

export const UsageCard = ({ title, usage, limit, loading = false }) => {
  return (
    <Card>
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="heading" className="w-1/4" />
          <Skeleton variant="title" className="w-1/2 mr-4" />
        </div>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-lg  ">{title}</CardTitle>
          </CardHeader>
          <CardContent className="-mt-3 font-medium">
            <p>{usage} minutes</p>
          </CardContent>
        </>
      )}
    </Card>
  );
};

const UsageSummary = () => {
  const {
    user,
    getBillingUsage,
    getUpcomingInvoice,
    getSubscription,
    getInvoices,
    getUserProduct,
  } = useApi();
  const [usage, setUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [overUsageBill, setOverUsageBill] = useState<OverUsageBill | null>(
    null
  );
  const [upcomingInvoiceTotal, setUpcomingInvoiceTotal] = useState(0);
  const [upcomingInvoice, setUpcomingInvoice] = useState<any>(null);
  const product = getUserProduct(user);
  const prices = product.usage;

  useEffect(() => {
    const doGetInvoices = async (stripeCustomerId) => {
      const [res, invoices] = await getInvoices(stripeCustomerId);
      if (res.status == 200) {
        setInvoices(invoices);
      }
    };

    const doGetUsage = async (fromTime, toTime, status) => {
      fromTime = fromTime * 1000;
      toTime = toTime * 1000;

      if (status === "canceled") {
        const now = new Date();
        fromTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        toTime = now.getTime();
      }

      let [
        res,
        usage = {
          TotalUsageMins: 0,
          DeliveryUsageMins: 0,
          StorageUsageMins: 0,
        },
      ] = await getBillingUsage(fromTime, toTime);

      if (res.status == 200) {
        setUsage(usage);
        await doCalculateOverUsage(usage);
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
        subscription?.status
      );
    };

    const doCalculateOverUsage = async (usage) => {
      const overusage = await calculateOverUsage(product, usage);
      if (overusage) {
        const oBill = await calculateOverUsageBill(overusage);
        setOverUsageBill(oBill);
        let [res, uInvoice] = await getUpcomingInvoice(user.stripeCustomerId);
        setUpcomingInvoice(uInvoice?.invoices);
        setUpcomingInvoiceTotal((uInvoice?.invoices?.total / 100) | 0);
      }
    };

    const calculateOverUsage = async (product, usage) => {
      const limits = {
        transcoding: product?.usage[0].limit,
        streaming: product?.usage[1].limit,
        storage: product?.usage[2].limit,
      };

      const overUsage = {
        TotalUsageMins: Math.max(usage?.TotalUsageMins - limits.transcoding, 0),
        DeliveryUsageMins: Math.max(
          usage?.DeliveryUsageMins - limits.streaming,
          0
        ),
        StorageUsageMins: Math.max(usage?.StorageUsageMins - limits.storage, 0),
      };

      return overUsage;
    };

    const calculateOverUsageBill = async (overusage) => {
      const payAsYouGoData = products["prod_O9XuWMU1Up6QKf"];

      const overUsageBill: OverUsageBill = {
        transcodingBill: {
          units: overusage.TotalUsageMins,
          total: Number(
            (overusage.TotalUsageMins * payAsYouGoData.usage[0].price).toFixed(
              2
            )
          ),
        },
        deliveryBill: {
          units: overusage.DeliveryUsageMins,
          total: Number(
            (
              overusage.DeliveryUsageMins * payAsYouGoData.usage[1].price
            ).toFixed(2)
          ),
        },
        storageBill: {
          units: overusage.StorageUsageMins,
          total: Number(
            (
              overusage.StorageUsageMins * payAsYouGoData.usage[2].price
            ).toFixed(2)
          ),
        },
      };

      return overUsageBill;
    };

    if (user) {
      doGetInvoices(user.stripeCustomerId);
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  const June = useJune();

  const trackEvent = useCallback(() => {
    if (June) June.track(events.landing.billingCta);
  }, [June]);

  return (
    <>
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
              Usage
            </Box>
            <Flex align="center" css={{ mr: "$3" }}>
              <Tooltip
                multiline
                // @ts-ignore
                content={
                  <Box>
                    Usage minutes may take up to an hour to be reflected.
                  </Box>
                }>
                <Help />
              </Tooltip>
            </Flex>
            <Badge
              size="1"
              variant="neutral"
              css={{ letterSpacing: 0, mt: "7px" }}>
              {user?.stripeProductId
                ? products[user.stripeProductId]?.name
                : products["prod_O9XuIjn7EqYRVW"].name}{" "}
              Plan
            </Badge>
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
      <Grid gap="4" columns="3">
        <UsageCard
          title="Transcoding minutes"
          loading={!usage}
          usage={usage && usage.TotalUsageMins.toFixed(2).toLocaleString()}
          limit={!products[user.stripeProductId]?.order ? 1000 : false}
        />
        <UsageCard
          title="Delivery minutes"
          loading={!usage}
          usage={usage && usage.DeliveryUsageMins.toFixed(2).toLocaleString()}
          limit={!products[user.stripeProductId]?.order ? 10000 : false}
        />
        <UsageCard
          title="Storage minutes"
          loading={!usage}
          usage={usage && usage.StorageUsageMins.toFixed(2).toLocaleString()}
          limit={!products[user.stripeProductId]?.order ? 1000 : false}
        />
      </Grid>
      <Flex
        justify="between"
        align="center"
        css={{ fontSize: "$3", color: "$hiContrast" }}>
        <Link href="/settings/billing" passHref legacyBehavior>
          <A
            variant="primary"
            css={{ display: "flex", alignItems: "center" }}
            onClick={() => trackEvent()}>
            View billing <ArrowRightIcon />
          </A>
        </Link>
      </Flex>
    </>
  );
};

export default UsageSummary;
