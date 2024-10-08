import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { Box, Flex, Link as A } from "@livepeer/design-system";
import { Grid } from "components/ui/grid";
import { Text } from "components/ui/text";
import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardUsage as Content } from "content";
import React, { PureComponent } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { UsageCard } from "components/UsageSummary";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";

const Usage = () => {
  useLoggedIn();
  const {
    user,
    getUsage,
    getBillingUsage,
    getSubscription,
    getInvoices,
    getUserProduct,
  } = useApi();
  const [_usage, setUsage] = useState(null);
  const [billingUsage, setBillingUsage] = useState<any>({
    TotalUsageMins: 0,
    DeliveryUsageMins: 0,
    StorageUsageMins: 0,
  });
  const [subscription, setSubscription] = useState(null);
  const [timestep, setTimestep] = useState("day");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [usageData, setUsageData] = useState([]);

  const doSetTimeStep = async (ts: string) => {
    setTimestep(ts);
    const [
      res,
      usage = {
        TotalUsageMins: 0,
        DeliveryUsageMins: 0,
        StorageUsageMins: 0,
      },
    ] = await getBillingUsage(from, to, null, ts);
    if (res.status == 200 && Array.isArray(usage)) {
      const now = new Date();
      const currentMonth = now.toLocaleString("default", { month: "short" });
      let dayCounter = 1;

      for (let i = 0; i < usage.length; i++) {
        const item = usage[i];
        if (ts == "day") {
          item.name = `${currentMonth} ${dayCounter}`;
          dayCounter++;
        } else {
          item.name = "";
        }
      }

      setUsageData(usage);
      console.log(usage);
    }
  };

  const doSetFrom = async (from: number) => {
    setFrom(from);
  };

  const doSetTo = async (to: number) => {
    setTo(to);
  };

  useEffect(() => {
    const doGetUsage = async (fromTime, toTime, userId) => {
      const [res, usage] = await getUsage(fromTime, toTime, userId);
      if (res.status == 200) {
        setUsage(usage);
      }
    };

    const doGetBillingUsage = async (
      fromTime: any,
      toTime: any,
      status: any,
    ) => {
      fromTime = fromTime * 1000;
      toTime = toTime * 1000;

      // if subscription is cancelled, get current month data
      if (status === "canceled") {
        const now = new Date();
        fromTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        toTime = now.getTime();
      }

      let [res, usage] = await getBillingUsage(fromTime, toTime);

      if (res.status == 200) {
        if (!usage) {
          usage = {
            TotalUsageMins: 0,
            DeliveryUsageMins: 0,
            StorageUsageMins: 0,
          };
        }
        setBillingUsage(usage);
      }

      const [res2, usageByDay] = await getBillingUsage(
        fromTime,
        toTime,
        null,
        timestep,
      );
      if (res2.status == 200 && Array.isArray(usageByDay)) {
        setUsageData(usageByDay);
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
        user.id,
      );
      doGetBillingUsage(
        subscription?.current_period_start,
        subscription?.current_period_end,
        subscription?.status,
      );
    };

    if (user) {
      getSubscriptionAndUsage(user.stripeCustomerSubscriptionId);
    }
  }, [user]);

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="settings/usage"
      breadcrumbs={[{ title: "Usage" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$7" }}>
          <Flex className="gap-2 border-b border-accent pb-4 mb-5 w-full justify-between items-center">
            <Text size="lg">Usage</Text>

            <Text variant="neutral">
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
        </Box>

        <Box>
          <Flex className="justify-between mb-4">
            <Text>Summary</Text>
            <Flex align="center">
              <TooltipUI>
                <TooltipTrigger asChild>
                  <Help />
                </TooltipTrigger>
                <TooltipContent>
                  Usage minutes may take up to an hour to be reflected.
                </TooltipContent>
              </TooltipUI>
            </Flex>
          </Flex>
          <Grid className="grid-cols-1 md:grid-cols-3 gap-2">
            <UsageCard
              title="Transcoding minutes"
              loading={!billingUsage}
              usage={
                billingUsage &&
                billingUsage.TotalUsageMins.toFixed(2).toLocaleString()
              }
              limit={false}
            />
            <UsageCard
              title="Delivery minutes"
              loading={!billingUsage}
              usage={
                billingUsage &&
                billingUsage.DeliveryUsageMins.toFixed(2).toLocaleString()
              }
              limit={false}
            />
            <UsageCard
              title="Storage minutes"
              loading={!billingUsage}
              usage={
                billingUsage &&
                billingUsage.StorageUsageMins.toFixed(2).toLocaleString()
              }
              limit={false}
            />
          </Grid>
        </Box>

        <Text className="mb-4">Charts</Text>

        <Box css={{ mb: "$4", display: "" }}>
          <Select
            css={{ fontSize: "$3", px: "$2", mb: "$4" }}
            defaultValue="day"
            onValueChange={(e) => doSetTimeStep(e)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a time step" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
            </SelectContent>
          </Select>
        </Box>
        <Box className="mb-4 w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart height={40} data={usageData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="TotalUsageMins" fill="#30a46c" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box css={{ mb: "$4", display: "" }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart height={40} data={usageData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="DeliveryUsageMins" fill="#30a46c" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box css={{ mb: "$4", display: "" }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart height={40} data={usageData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="StorageUsageMins"
                stroke="#30a46c"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Layout>
  );
};

export default Usage;
