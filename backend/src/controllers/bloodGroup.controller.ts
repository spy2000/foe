import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/db";
import { logger } from "../config/logger";

export async function getBloodGroupsHandler(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const bloodGroups = await prisma.bloodGroup.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { id: "asc" },
    });

    return reply.status(200).send({
      success: true,
      data: bloodGroups,
    });
  } catch (error) {
    logger.error("Error retrieving blood groups:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to fetch blood groups",
    });
  }
}
