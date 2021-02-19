import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ label }) => {
  return (
    <div
      sx={{
        background: "rgba(0, 0, 0, 0.9)",
        padding: "8px",
        borderRadius: "4px",
      }}>
      <p sx={{ fontSize: "12px", color: "white" }}>
        Rate: <b>{label} kbps</b>
      </p>
    </div>
  );
};

const Chart = ({ data }) => {
  return (
    <ResponsiveContainer width="99%" height={300}>
      <AreaChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <CartesianGrid vertical={false} />
        <Tooltip content={<CustomTooltip label={data.kbps} />} />
        <Area
          cursor="pointer"
          type="monotone"
          dataKey="kbps"
          stroke="#943CFF"
          strokeWidth="2px"
          fill="rgba(91, 77, 190, 0.4)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default Chart;
