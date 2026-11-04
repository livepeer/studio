import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { Box, Tooltip as LPTooltip } from "@livepeer/design-system";
import { useEffect, useState } from "react";
import { DashboardUsage as Content } from "content";
import { BarChart, Bar, XAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { UsageCard } from "components/UsageSummary";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";
import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from "components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

const Usage = () => {
  useLoggedIn();
  const { user, getUsage, getBillingUsage, getSubscription } = useApi();
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

  const updateUsageData = async (fromTime, toTime, ts) => {
    const [res, usage = []] = await getBillingUsage(fromTime, toTime, null, ts);
    if (res.status === 200 && Array.isArray(usage)) {
      const formattedUsage = formatUsageData(usage);
      setUsageData(formattedUsage);
    }
  };

  const updateBillingUsage = async (fromTime, toTime) => {
    const [res, usage] = await getBillingUsage(fromTime, toTime);
    if (res.status === 200) {
      setBillingUsage(
        usage || {
          TotalUsageMins: 0,
          DeliveryUsageMins: 0,
          StorageUsageMins: 0,
        }
      );
    }
  };

  const handleTimeStepChange = async (ts: string) => {
    setTimestep(ts);
    await updateUsageData(from, to, ts);
  };

  const handleDateChange = async (fromTime: number, toTime: number) => {
    setFrom(fromTime);
    setTo(toTime);
    await updateBillingUsage(fromTime, toTime);
    await updateUsageData(fromTime, toTime, timestep);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const [res, subscription] = await getSubscription(
        user.stripeCustomerSubscriptionId
      );
      if (res.status === 200 && subscription) {
        setSubscription(subscription);
        const { current_period_start, current_period_end } = subscription ?? {};
        setFrom((current_period_start as number) ?? 0);
        setTo((current_period_end as number) ?? 0);
        await updateBillingUsage(
          (current_period_start as number) ?? 0,
          (current_period_end as number) ?? 0
        );
        await updateUsageData(
          (current_period_start as number) ?? 0,
          (current_period_end as number) ?? 0,
          timestep
        );
      }
    };

    if (user) {
      fetchInitialData();
    }
  }, [user]);

  if (!user) {
    return <Layout />;
  }

  const formatUsageData = (usage) => {
    const TotalUsageMins = [];
    const DeliveryUsageMins = [];
    const StorageUsageMins = [];

    usage.forEach((item) => {
      const date = new Date(item.TimeInterval).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      TotalUsageMins.push({ name: date, value: item.TotalUsageMins });
      DeliveryUsageMins.push({ name: date, value: item.DeliveryUsageMins });
      StorageUsageMins.push({ name: date, value: item.StorageUsageMins });
    });

    return [
      { name: "Transcoding usage minutes", data: TotalUsageMins },
      { name: "Delivery usage minutes", data: DeliveryUsageMins },
      { name: "Storage usage minutes", data: StorageUsageMins },
    ];
  };

  return (
    <Layout
      id="settings/usage"
      breadcrumbs={[{ title: "Usage" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$7" }}>
          <div className="flex  justify-between border-b border-border pb-4 mb-5 w-[100%]">
            <h2 className="flex items-center text-2xl font-semibold leading-none tracking-tight">
              Usage
            </h2>
            <div className="flex">
              Current billing period (
              {subscription && (
                <div>
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
                </div>
              )}
              )
            </div>
          </div>
        </Box>
        <div className="mb-7 flex flex-col space-y-4 ">
          <h2 className="flex items-center text-xl font-semibold leading-none tracking-tight">
            Summary
            <span className="ml-2">
              <LPTooltip
                multiline
                content={
                  <p>Usage minutes may take up to an hour to be reflected.</p>
                }>
                <Help />
              </LPTooltip>
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <UsageCard
              title="Transcoding minutes"
              loading={!billingUsage}
              usage={
                (billingUsage &&
                  billingUsage?.TotalUsageMins?.toFixed(2).toLocaleString()) ||
                0
              }
              limit={false}
            />
            <UsageCard
              title="Delivery minutes"
              loading={!billingUsage}
              usage={
                (billingUsage &&
                  billingUsage?.DeliveryUsageMins?.toFixed(
                    2
                  ).toLocaleString()) ||
                0
              }
              limit={false}
            />
            <UsageCard
              title="Storage minutes"
              loading={!billingUsage}
              usage={
                (billingUsage &&
                  billingUsage?.StorageUsageMins?.toFixed(
                    2
                  ).toLocaleString()) ||
                0
              }
              limit={false}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="flex items-center text-xl font-semibold leading-none tracking-tight">
            Charts
          </h2>
          <Select
            onValueChange={(value) => handleTimeStepChange(value)}
            defaultValue={timestep}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time step" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="hour">Hourly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {usageData.map((usageType, index) => (
            <Card className={`w-full `} key={usageType.name}>
              <CardHeader>
                <CardTitle className="capitalize">{usageType.name}</CardTitle>
                <CardDescription className="normal-case">{`${
                  usageType.name
                } ${new Date(from * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })} to ${new Date(to * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    desktop: {
                      label: "Desktop",
                      color: "#fff",
                    },
                  }}
                  className="w-full">
                  <BarChart data={usageType.data}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="value" fill="#3B8F68" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </Box>
    </Layout>
  );
};

export default Usage;
