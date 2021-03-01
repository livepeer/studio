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
    <div sx={{ width: "100%", position: "relative"}}>
      <p
        sx={{
          color: "#666666",
          fontSize: "12px",
          transform: "rotate(-90deg)",
          position: "absolute",
          left: '-70px',
          bottom: "70px",
        }}>
        kbps (multiplied by 1000)
      </p>
      <p
        sx={{
          color: "#666666",
          fontSize: "12px",
          position: "absolute",
          bottom: "-20px",
          left: "70px",
        }}>
        sec
      </p>
      <ResponsiveContainer width="99%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorKbps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" />
          <YAxis domain={["dataMin - 200", "dataMax + 200"]} />
          <CartesianGrid vertical={false} />
          <Tooltip content={<CustomTooltip label={data.kbps} />} />
          <Area
            cursor="pointer"
            type="monotone"
            dataKey="kbps"
            stroke="#943CFF"
            strokeWidth="2px"
            fill="url(#colorKbps)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
