import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../config/logger";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error("Unhandled error processing %s %s: %s", request.method, request.url, error.message, {
    stack: error.stack,
    statusCode: error.statusCode || 500,
  });

  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500
      ? "Internal server error. Please try again later."
      : error.message;

  return reply.status(statusCode).send({
    success: false,
    error: message,
    statusCode,
  });
}
