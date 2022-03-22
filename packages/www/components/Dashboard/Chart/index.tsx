import { Box, Text } from "@livepeer.com/design-system";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const getMultistreamColor = (number) => {
  switch (number) {
    case 1:
      return "#aa99ec";
    case 2:
      return "#8da4ef";
    case 3:
      return "#2da4ef";
    case 4:
      return "#7da41f";
    default:
      return "#7d241f";
  }
};

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
          {payload.map((item) => (
            <div>
              {item.dataKey}: <b>{item.value} kbps</b>
            </div>
          ))}
        </Text>
      </Box>
    );
  }

  return null;
};
const Chart = ({
  data,
  multiData,
}: {
  data: Array<{ name: number; "Session bitrate": number }>;
  multiData?: Array<{
    [name: string]: number;
  }>;
}) => {
  const multistreamNames =
    multiData && multiData[0] && Object.keys(multiData[0]);
  return (
    <Box
      css={{
        width: "100%",
        position: "relative",
        ".recharts-cartesian-axis-tick": {
          fontSize: "$2",
        },
      }}>
      <Text
        variant="gray"
        size="1"
        css={{
          transform: "rotate(-90deg)",
          position: "absolute",
          left: "-70px",
          bottom: "70px",
        }}>
        kbps (multiplied by 1000)
      </Text>
      <Text
        variant="gray"
        size="1"
        css={{
          position: "absolute",
          bottom: "-30px",
          left: "50px",
        }}>
        Seconds since stream loaded
      </Text>
      <ResponsiveContainer width="99%" height={300}>
        <LineChart>
          <XAxis
            type="number"
            dataKey="name"
            domain={[
              data[0]?.name,
              data.length < 2 ? 10 : data[data.length - 1].name,
            ]}
            tickCount={7}
            allowDataOverflow
          />
          <YAxis domain={[0, 1600]} />
          <CartesianGrid vertical={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "10px" }} />
          <Line
            data={data}
            cursor="pointer"
            type="monotone"
            dataKey="Session bitrate"
            stroke="#5746AF"
            strokeWidth="2px"
          />
          {multistreamNames?.map((item, index) => {
            if (item !== "name")
              return (
                <Line
                  data={multiData}
                  cursor="pointer"
                  type="monotone"
                  dataKey={item}
                  stroke={getMultistreamColor(index)}
                  strokeWidth="2px"
                />
              );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default Chart;
