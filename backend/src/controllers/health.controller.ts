import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/db";
import { logger } from "../config/logger";

export async function healthCheckHandler(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Execute a lightweight query to keep DB connections active and warm
    await prisma.$queryRaw`SELECT 1`;

    return reply.status(200).send({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: "connected",
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Health check failed - Database disconnected:", {
      error: err.message,
      stack: err.stack,
    });

    return reply.status(503).send({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: "disconnected",
    });
  }
}
