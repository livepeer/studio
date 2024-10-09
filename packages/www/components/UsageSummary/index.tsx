import {
  Box,
  Badge,
  Flex,
  Link as A,
  styled,
  Skeleton,
} from "@livepeer/design-system";
import { Grid } from "components/ui/grid";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/ui/tooltip";
import { Text } from "components/ui/text";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import UpcomingIcon from "../../public/img/icons/upcoming.svg";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "hooks";
import { products } from "@livepeer.studio/api/src/config";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";
import { useJune, events } from "hooks/use-june";

const StyledUpcomingIcon = styled(UpcomingIcon, {
  mr: "$2",
  color: "$gray",
});

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
    <Box className="px-5 py-4 bg-card text-card-foreground mb-6 min-h-24 rounded-md flex flex-col gap-3">
      {loading ? (
        <Box
          css={{
            display: "flex",
            fd: "column",
            gap: "$3",
          }}>
          <Skeleton variant="heading" css={{ width: "25%" }} />
          <Skeleton variant="title" css={{ width: "50%", mr: "$3" }} />
        </Box>
      ) : (
        <>
          <Flex align="center">
            <Text css={{ mb: "$2", mr: "$3", color: "$hiContrast" }}>
              {title}
            </Text>
          </Flex>
          <Flex align="center" css={{ fontSize: "$6" }}>
            <Box css={{ fontWeight: 700 }}>{usage}</Box>
          </Flex>
        </>
      )}
    </Box>
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
    null,
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
        subscription?.status,
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
          0,
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
              2,
            ),
          ),
        },
        deliveryBill: {
          units: overusage.DeliveryUsageMins,
          total: Number(
            (
              overusage.DeliveryUsageMins * payAsYouGoData.usage[1].price
            ).toFixed(2),
          ),
        },
        storageBill: {
          units: overusage.StorageUsageMins,
          total: Number(
            (
              overusage.StorageUsageMins * payAsYouGoData.usage[2].price
            ).toFixed(2),
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
        className="gap-2"
        justify="between"
        align="end"
        css={{
          borderBottom: "1px solid",
          borderColor: "$neutral6",
          pb: "$4",
          mb: "$5",
          width: "100%",
        }}>
        <Flex>
          <Text className="mr-3" size="lg" weight="medium">
            Usage
          </Text>
          <Flex align="center" css={{ mr: "$3" }}>
            <Tooltip>
              <TooltipTrigger>
                <Help />
              </TooltipTrigger>
              <TooltipContent>
                Usage minutes may take up to an hour to be reflected.
              </TooltipContent>
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

        <Text size="sm" variant="neutral">
          Current billing period (
          {subscription && (
            <span>
              {new Date(
                subscription.current_period_start * 1000,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              to{" "}
              {new Date(
                subscription.current_period_end * 1000,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
            </span>
          )}
          )
        </Text>
      </Flex>
      <Grid className="grid-cols-1 md:grid-cols-3 gap-2">
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
