import { Box, Text } from "@livepeer.com/design-system";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload) {
    return (
      <Box
        css={{
          background: "rgba(0, 0, 0, 0.9)",
          padding: "8px",
          borderRadius: "4px",
        }}>
        <Text
          css={{
            fontSize: "12px",
            color: "white",
          }}>
          Rate: <b>{payload[0].value} kbps</b>
        </Text>
      </Box>
    );
  }

  return null;
};

const Chart = ({ data }) => {
  return (
    <Box css={{ width: "100%", position: "relative" }}>
      <Text
        css={{
          color: "#666666",
          fontSize: "12px",
          transform: "rotate(-90deg)",
          position: "absolute",
          left: "-70px",
          bottom: "70px",
        }}>
        kbps (multiplied by 1000)
      </Text>
      <Text
        css={{
          color: "#666666",
          fontSize: "12px",
          position: "absolute",
          bottom: "-30px",
          left: "50px",
        }}>
        Seconds since stream loaded in test player
      </Text>
      <ResponsiveContainer width="99%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorKbps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6E56CF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6E56CF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 1600]} />
          <CartesianGrid vertical={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            cursor="pointer"
            type="monotone"
            dataKey="kbps"
            stroke="#6E56CF"
            strokeWidth="2px"
            fill="url(#colorKbps)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default Chart;
