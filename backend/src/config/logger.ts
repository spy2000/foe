import winston from "winston";
import path from "path";
import fs from "fs";

const logsDir = path.resolve(__dirname, "../../logs");

// Automatically ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const errorLogPath = path.join(logsDir, "error.log");
const combinedLogPath = path.join(logsDir, "combined.log");

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "foe-backend" },
  transports: [
    // Stream error logs to logs/error.log (level: error)
    new winston.transports.File({
      filename: errorLogPath,
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    // Stream combined logs to logs/combined.log (level: info)
    new winston.transports.File({
      filename: combinedLogPath,
      level: "info",
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Automatically handle and log uncaught exceptions and unhandled promise rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: errorLogPath }),
    new winston.transports.Console({ format: consoleFormat }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: errorLogPath }),
    new winston.transports.Console({ format: consoleFormat }),
  ],
});
