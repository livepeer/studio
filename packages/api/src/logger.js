import winston from "winston";

const isSilentTest =
  process.env.NODE_ENV === "test" && process.argv.indexOf("--silent") > 0;
const verbose =
  process.argv.indexOf("--verbose") > 0 ||
  ["true", "1"].includes(process.env.LP_API_VERBOSE?.toLowerCase());

export default winston.createLogger({
  silent: isSilentTest,
  level: verbose ? "debug" : "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.align(),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...extra } = info;

      return `${timestamp} [${level}]: ${message} ${
        Object.keys(extra).length ? JSON.stringify(extra, null, 2) : ""
      }`;
    }),
  ),
  transports: [new winston.transports.Console()],
});
