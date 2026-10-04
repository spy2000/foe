import { FastifyInstance } from "fastify";
import { getBloodGroupsHandler } from "../controllers/bloodGroup.controller";

export async function bloodGroupRoutes(fastify: FastifyInstance) {
  fastify.get("/blood-groups", getBloodGroupsHandler);
}
