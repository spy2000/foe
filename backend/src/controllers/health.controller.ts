import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { sendBrevoEmail } from "../lib/email";

let cachedLastKeepAlive: number | null = null;
const TWENTY_FIVE_DAYS_MS = 25 * 24 * 60 * 60 * 1000;

export async function healthCheckHandler(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  // 1. Instantly return 200 OK (0ms response for the ping service)
  reply.status(200).send({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });

  // 2. Background processing loop (Fire and Forget)
  setImmediate(async () => {
    try {
      const now = Date.now();

      // Hydrate cache on cold server boot
      if (cachedLastKeepAlive === null) {
        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
          settings = await prisma.systemSettings.create({ data: {} });
        }
        cachedLastKeepAlive = settings.lastKeepAliveAt.getTime();
      }

      // Trigger Brevo email only if 25 days have passed since the last ping
      if (cachedLastKeepAlive !== null) {
        if (now - cachedLastKeepAlive > TWENTY_FIVE_DAYS_MS) {
          cachedLastKeepAlive = now; // Optimistic lock to prevent parallel execution

          const systemEmail = process.env.SYSTEM_EMAIL || "admin@friendsofeducation.in";
          await Promise.all([
            prisma.systemSettings.updateMany({
              data: { lastKeepAliveAt: new Date(now) },
            }),
            sendBrevoEmail(
              systemEmail,
              "API Keep-Alive Ping",
              "<p>Automated ping to prevent Brevo API deactivation.</p>"
            ).catch((err: unknown) => {
              if (err instanceof Error) {
                logger.error(`[Brevo Ping Error] ${err.message}`);
              } else {
                logger.error("[Brevo Ping Error] An unknown error occurred");
              }
            }),
          ]);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("[Health Check Background Error]", {
          error: error.message,
          stack: error.stack,
        });
      } else {
        logger.error("[Health Check Background Error]: An unknown error occurred");
      }
    }
  });
}
