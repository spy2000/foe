import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { logger } from "./config/logger";
import { corsOptions } from "./middlewares/cors";
import { errorHandler } from "./middlewares/errorHandler";
import { memberRoutes } from "./routes/member.routes";
import { settingsRoutes } from "./routes/settings.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { bloodGroupRoutes } from "./routes/bloodGroup.routes";
import { healthRoutes } from "./routes/health.routes";
import { healthCheckHandler } from "./controllers/health.controller";

export function createServer() {
  const server = Fastify({
    logger: false, // Using winston logger middleware instead
  });

  // Global BigInt JSON serialization hook
  // Converts any BigInt value to string to completely prevent JSON serialization errors
  server.setReplySerializer((payload) => {
    return JSON.stringify(payload, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
  });

  // HTTP Request Logging Middleware (Winston)
  server.addHook("onRequest", async (request) => {
    // Record request start time
    (request as unknown as { startTime: number }).startTime = Date.now();
  });

  server.addHook("onResponse", async (request, reply) => {
    const startTime = (request as unknown as { startTime: number }).startTime || Date.now();
    const duration = Date.now() - startTime;
    const { method, url, ip } = request;
    const statusCode = reply.statusCode;

    const logMessage = `${method} ${url} ${statusCode} - ${duration}ms [${ip}]`;

    if (statusCode >= 500) {
      logger.error(logMessage, { method, url, statusCode, duration, ip });
    } else if (statusCode >= 400) {
      logger.warn(logMessage, { method, url, statusCode, duration, ip });
    } else {
      logger.info(logMessage, { method, url, statusCode, duration, ip });
    }
  });

  // Global Error Handler
  server.setErrorHandler(errorHandler);

  return server;
}

async function startServer() {
  const server = createServer();

  // Register CORS
  await server.register(cors, corsOptions);

  // Register Multipart for 2MB file uploads
  await server.register(multipart, {
    limits: {
      fileSize: 2 * 1024 * 1024,
      files: 1,
    },
  });

  // Healthcheck ping endpoint
  server.get("/health", healthCheckHandler);

  // Register all routes under /api
  await server.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(bloodGroupRoutes);
      await api.register(settingsRoutes);
      await api.register(memberRoutes);
      await api.register(uploadRoutes);
    },
    { prefix: "/api" }
  );

  const PORT = parseInt(process.env.PORT || "5000", 10);
  const HOST = "0.0.0.0";

  try {
    await server.listen({ port: PORT, host: HOST });
    logger.info(`🚀 FOE Backend listening on http://${HOST}:${PORT}`);
    console.log(`🚀 FOE Backend listening on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error("Failed to start Fastify server:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { startServer };
