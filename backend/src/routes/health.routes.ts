import { FastifyInstance } from "fastify";
import { healthCheckHandler } from "../controllers/health.controller";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", healthCheckHandler);
}
