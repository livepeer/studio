import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import {
  Box,
  Heading,
  Flex,
  Text,
  Link as A,
  Select,
} from "@livepeer/design-system";
import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardBilling as Content } from "content";
import React, { PureComponent } from "react";
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

const Billing = () => {
  useLoggedIn();
  const { user, getUsage, getBillingUsage } = useApi();
  const [_usage, setUsage] = useState(null);
  const [billingUsage, setBillingUsage] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [timestep, setTimestep] = useState("day");
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [usageData, setUsageData] = useState([]);

  const doSetTimeStep = async (ts: string) => {
    setTimestep(ts);
    const [res, usage] = await getBillingUsage(from, to, null, ts);
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

    const doGetBillingUsage = async () => {
      // Gather current month data
      const now = new Date();
      const fromTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const toTime = now.getTime();

      doSetFrom(fromTime);
      doSetTo(toTime);

      const [res, usage] = await getBillingUsage(fromTime, toTime);
      if (res.status == 200) {
        setBillingUsage(usage);
      }
      const [res2, usageByDay] = await getBillingUsage(
        fromTime,
        toTime,
        null,
        timestep
      );
      if (res2.status == 200 && Array.isArray(usageByDay)) {
        setUsageData(usageByDay);
      }
    };

    const getSubscriptionAndUsage = async (subscriptionId) => {
      doGetUsage(
        subscription?.current_period_start,
        subscription?.current_period_end,
        user.id
      );
      doGetBillingUsage();
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
      id="billing/usage"
      breadcrumbs={[{ title: "Usage" }]}
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
                  Usage
                </Box>
              </Flex>
            </Heading>
            <Flex css={{ fontSize: "$3", color: "$hiContrast" }}>
              Current billing period
            </Flex>
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
                  Summary
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
                    Delivery (Minutes)
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    Total Transcode Usage (Minutes)
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    Storage Usage (Minutes)
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
                    {Number(billingUsage.DeliveryUsageMins).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    {Number(billingUsage.TotalUsageMins).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #ddd",
                      textAlign: "center",
                    }}>
                    {Number(billingUsage.StorageUsageMins).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </Box>
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
                Charts
              </Box>
            </Flex>
          </Heading>
        </Flex>
        <Box css={{ mb: "$4" }}>
          <Select
            css={{ fontSize: "$3", px: "$2", mb: "$4" }}
            defaultValue="day"
            onChange={(e) => doSetTimeStep(e.target.value)}>
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
          </Select>
        </Box>
        <Box>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart width={150} height={40} data={usageData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="TotalUsageMins" fill="#30a46c" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart width={150} height={40} data={usageData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="DeliveryUsageMins" fill="#30a46c" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart width={150} height={40} data={usageData}>
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

export default Billing;
