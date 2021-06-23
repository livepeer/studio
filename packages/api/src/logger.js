import winston from "winston";

const isSilentTest =
  process.env.NODE_ENV === "test" && process.argv.indexOf("--silent") > 0;

export default winston.createLogger({
  silent: isSilentTest,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.align(),
    winston.format.printf((info) => {
      const { timestamp, level, message, ...extra } = info;

      return `${timestamp} [${level}]: ${message} ${
        Object.keys(extra).length ? JSON.stringify(extra, null, 2) : ""
      }`;
    })
  ),
  transports: [new winston.transports.Console()],
});
