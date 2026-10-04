import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import cloudinary from "../config/cloudinary";
import { UpdateSettingsInput } from "../schemas/settings.schema";
import { getCloudinaryPublicId } from "../utils/cloudinary.util";

export async function getSettingsHandler(_req: FastifyRequest, reply: FastifyReply) {
  try {
    let settings = await prisma.cardSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.cardSettings.create({
        data: {
          id: 1,
          logoUrl: "/logo.png",
          signatureUrl: "/placeholder-signature.png",
        },
      });
    }

    return reply.status(200).send({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error("Error retrieving card settings:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to fetch card settings",
    });
  }
}

export async function updateSettingsHandler(
  req: FastifyRequest<{ Body: UpdateSettingsInput }>,
  reply: FastifyReply
) {
  try {
    const { logoUrl, signatureUrl, oldLogoUrl, oldSignatureUrl, ...data } = req.body;

    const existing = await prisma.cardSettings.findUnique({
      where: { id: 1 },
    });

    // Purge old logo if replaced
    const logoToPurge = oldLogoUrl || (logoUrl && existing?.logoUrl && existing.logoUrl !== logoUrl ? existing.logoUrl : null);
    if (logoToPurge && logoToPurge !== logoUrl) {
      const publicId = getCloudinaryPublicId(logoToPurge);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          logger.info(`Purged old logo asset: ${publicId}`);
        } catch (err) {
          logger.error(`Cloudinary logo deletion error: ${err}`);
        }
      }
    }

    // Purge old signature if replaced
    const sigToPurge = oldSignatureUrl || (signatureUrl && existing?.signatureUrl && existing.signatureUrl !== signatureUrl ? existing.signatureUrl : null);
    if (sigToPurge && sigToPurge !== signatureUrl) {
      const publicId = getCloudinaryPublicId(sigToPurge);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          logger.info(`Purged old signature asset: ${publicId}`);
        } catch (err) {
          logger.error(`Cloudinary signature deletion error: ${err}`);
        }
      }
    }

    const updatePayload: Record<string, unknown> = { ...data };
    if (logoUrl !== undefined) updatePayload.logoUrl = logoUrl;
    if (signatureUrl !== undefined) updatePayload.signatureUrl = signatureUrl;

    const settings = await prisma.cardSettings.upsert({
      where: { id: 1 },
      update: updatePayload,
      create: {
        id: 1,
        logoUrl: logoUrl || "/logo.png",
        signatureUrl: signatureUrl || "/placeholder-signature.png",
        ...updatePayload,
      },
    });

    logger.info("Updated card settings (ID: 1)");

    return reply.status(200).send({
      success: true,
      data: settings,
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Failed to update card settings:", { error: err.message, stack: err.stack });
    return reply.status(500).send({
      success: false,
      error: "Failed to update card settings",
    });
  }
}
