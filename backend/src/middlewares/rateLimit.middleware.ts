import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../config/logger";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const authIpStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

// Periodic cleanup of stale IP records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of authIpStore.entries()) {
    if (now > record.resetTime) {
      authIpStore.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Fastify rate limit route configuration for @fastify/rate-limit plugin
 */
export const authRateLimitConfig = {
  max: MAX_REQUESTS,
  timeWindow: "15 minutes",
  errorResponseBuilder: (
    _req: FastifyRequest,
    context: { max: number; ttl: number; after: string }
  ) => {
    return {
      success: false,
      statusCode: 429,
      error: "Too Many Requests",
      message: `Too many authentication attempts. Please try again after ${context.after}.`,
    };
  },
};

/**
 * Composable Fastify preHandler middleware: authLimiter
 * Strictly limits requests to 5 per 15 minutes per IP address.
 * Applicable to /api/auth/login, /api/auth/forgot-password, etc.
 */
export async function authLimiter(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
  const now = Date.now();

  const record = authIpStore.get(ip);

  if (!record || now > record.resetTime) {
    authIpStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return;
  }

  if (record.count >= MAX_REQUESTS) {
    const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
    logger.warn(`Auth rate limit exceeded for IP: ${ip}`);

    reply.header("Retry-After", remainingSeconds.toString());
    return reply.status(429).send({
      success: false,
      statusCode: 429,
      error: "Too Many Requests",
      message: `Too many authentication attempts. Please try again in ${Math.ceil(remainingSeconds / 60)} minute(s).`,
    });
  }

  record.count += 1;
}
