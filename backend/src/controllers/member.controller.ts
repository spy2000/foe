import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import cloudinary from "../config/cloudinary";
import { CreateMemberInput, UpdateMemberInput } from "../schemas/member.schema";
import { getCloudinaryPublicId } from "../utils/cloudinary.util";

export const extractCloudinaryPublicId = getCloudinaryPublicId;

export async function getNextMemberId(): Promise<string> {
  const lastMember = await prisma.member.findFirst({
    orderBy: { id: "desc" },
    select: { memberId: true },
  });

  let nextNum = 1;
  if (lastMember?.memberId) {
    const numericPart = lastMember.memberId.replace(/\D/g, "");
    const parsed = parseInt(numericPart, 10);
    if (!isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  }

  // 4-digit zero-padded sequential ID: 0001, 0002, 0003...
  return String(nextNum).padStart(4, "0");
}

export async function getNextMemberIdHandler(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const nextMemberId = await getNextMemberId();
    return reply.status(200).send({
      success: true,
      data: { nextMemberId },
    });
  } catch (error) {
    logger.error("Failed calculating next member ID:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to generate next member ID",
    });
  }
}

export async function getMembersHandler(
  req: FastifyRequest<{
    Querystring: {
      cursor?: string;
      limit?: string;
      status?: "active" | "deleted" | "all";
      includeDeleted?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { cursor, limit, status, includeDeleted } = req.query;
    const takeLimit = Math.min(limit ? parseInt(limit, 10) : 10, 50);

    const where: Record<string, unknown> = {};

    if (includeDeleted === "true" || status === "all") {
      // Return all
    } else if (status === "deleted") {
      where.deletedAt = { not: null };
    } else {
      // Default: Active members
      where.deletedAt = null;
    }

    const queryOptions: Record<string, unknown> = {
      where,
      take: takeLimit + 1,
      orderBy: { id: "desc" },
      include: { bloodGroup: true },
    };

    if (cursor) {
      queryOptions.cursor = { id: BigInt(cursor) };
      queryOptions.skip = 1;
    }

    const items = await prisma.member.findMany(
      queryOptions as Parameters<typeof prisma.member.findMany>[0]
    );

    let nextCursor: string | null = null;
    const hasMore = items.length > takeLimit;
    if (hasMore) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id.toString() : null;
    }

    return reply.status(200).send({
      success: true,
      data: {
        items,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    logger.error("Error retrieving members list:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to fetch members directory",
    });
  }
}

export async function getMemberByIdHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const member = await prisma.member.findUnique({
      where: { id: BigInt(id) },
      include: { bloodGroup: true },
    });

    if (!member) {
      return reply.status(404).send({
        success: false,
        error: "Member not found",
      });
    }

    const settings = await prisma.cardSettings.findUnique({
      where: { id: 1 },
    });

    return reply.status(200).send({
      success: true,
      data: {
        member,
        settings,
      },
    });
  } catch (error) {
    logger.error("Error retrieving member by id:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to retrieve member details",
    });
  }
}

export async function createMemberHandler(
  req: FastifyRequest<{ Body: CreateMemberInput }>,
  reply: FastifyReply
) {
  try {
    const data = req.body;
    const memberId = await getNextMemberId();

    const member = await prisma.member.create({
      data: {
        memberId,
        registrationNo: data.registrationNo,
        fullName: data.fullName,
        designation: data.designation,
        bloodGroupId: data.bloodGroupId,
        contactNumber: data.contactNumber,
        emailId: data.emailId,
        dateOfJoining: new Date(data.dateOfJoining),
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelationship: data.emergencyContactRelationship,
        emergencyContactNumber: data.emergencyContactNumber,
        photoPath: data.photoPath,
        issueDate: new Date(data.issueDate),
        expiryDate: new Date(data.expiryDate),
        memberStatus: data.memberStatus,
        authorisedName: data.authorisedName,
        authorisedDesignation: data.authorisedDesignation,
        remarks: data.remarks || null,
      },
      include: { bloodGroup: true },
    });

    logger.info("Successfully created member: %s (ID: %s)", member.fullName, member.memberId);

    return reply.status(201).send({
      success: true,
      data: member,
    });
  } catch (error) {
    logger.error("Error creating member record:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to create member record",
    });
  }
}

export async function deleteMemberHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const member = await prisma.member.update({
      where: { id: BigInt(id) },
      data: {
        deletedAt: new Date(),
        deletedBy: "admin",
      },
    });

    logger.info("Soft-deleted member id: %s", id);

    return reply.status(200).send({
      success: true,
      message: "Member soft-deleted successfully",
      data: member,
    });
  } catch (error) {
    logger.error("Error soft-deleting member:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to soft delete member",
    });
  }
}

export async function restoreMemberHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = req.params;
    const member = await prisma.member.update({
      where: { id: BigInt(id) },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });

    logger.info("Restored member id: %s", id);

    return reply.status(200).send({
      success: true,
      message: "Member restored successfully",
      data: member,
    });
  } catch (error) {
    logger.error("Error restoring member:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to restore member",
    });
  }
}

export async function permanentDeleteMemberHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  try {
    const member = await prisma.member.findUnique({
      where: { id: BigInt(id) },
    });

    if (!member) {
      logger.error("Permanent delete failed: Member not found with id %s", id);
      return reply.status(404).send({
        success: false,
        message: "Member not found",
      });
    }

    // Extract Cloudinary public ID if applicable
    const publicId = extractCloudinaryPublicId(member.photoPath);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
        logger.info(`Destroyed Cloudinary asset: ${publicId}`);
      } catch (err) {
        logger.error(`Cloudinary deletion error: ${err}`);
      }
    }

    // Delete record permanently from database
    await prisma.member.delete({
      where: { id: BigInt(id) },
    });

    logger.info("Permanently deleted member id: %s", id);

    return reply.status(200).send({
      success: true,
      message: "Member and photo permanently deleted.",
    });
  } catch (error) {
    logger.error("Error permanently deleting member:", error);
    return reply.status(500).send({
      success: false,
      message: "Failed to permanently delete member record",
    });
  }
}

export async function updateMemberHandler(
  req: FastifyRequest<{ Params: { id: string }; Body: UpdateMemberInput }>,
  reply: FastifyReply
) {
  const { id } = req.params;
  const data = req.body;
  try {
    const existing = await prisma.member.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      logger.error("Member not found for update: id %s", id);
      return reply.status(404).send({
        success: false,
        message: "Member not found",
      });
    }

    const updateData: Record<string, unknown> = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.registrationNo !== undefined) updateData.registrationNo = data.registrationNo;
    if (data.designation !== undefined) updateData.designation = data.designation;
    if (data.bloodGroupId !== undefined) updateData.bloodGroupId = Number(data.bloodGroupId);
    if (data.contactNumber !== undefined) updateData.contactNumber = data.contactNumber;
    if (data.emailId !== undefined) updateData.emailId = data.emailId;
    if (data.dateOfJoining !== undefined) updateData.dateOfJoining = new Date(data.dateOfJoining);
    if (data.emergencyContactName !== undefined) updateData.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactRelationship !== undefined) updateData.emergencyContactRelationship = data.emergencyContactRelationship;
    if (data.emergencyContactNumber !== undefined) updateData.emergencyContactNumber = data.emergencyContactNumber;
    
    // Intelligent Image Updates: Check if photoPath is updated
    if (data.photoPath !== undefined && data.photoPath !== existing.photoPath) {
      // Changed: Delete the old Cloudinary asset if it exists
      if (existing.photoPath) {
        const oldPublicId = extractCloudinaryPublicId(existing.photoPath);
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
            logger.info(`Destroyed old Cloudinary asset on update: ${oldPublicId}`);
          } catch (err) {
            logger.error(`Cloudinary deletion error: ${err}`);
          }
        }
      }
      updateData.photoPath = data.photoPath;
    }

    if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
    if (data.expiryDate !== undefined) updateData.expiryDate = new Date(data.expiryDate);
    if (data.memberStatus !== undefined) updateData.memberStatus = data.memberStatus;
    if (data.authorisedName !== undefined) updateData.authorisedName = data.authorisedName;
    if (data.authorisedDesignation !== undefined) updateData.authorisedDesignation = data.authorisedDesignation;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;

    const updated = await prisma.member.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: { bloodGroup: true },
    });

    logger.info("Successfully updated member: %s (ID: %s)", updated.fullName, updated.memberId);

    return reply.status(200).send({
      success: true,
      message: "Member updated successfully",
      data: updated,
    });
  } catch (error) {
    logger.error("Error updating member id %s:", id, error);
    return reply.status(500).send({
      success: false,
      message: "Failed to update member details",
    });
  }
}

export async function bulkSoftDeleteMembersHandler(
  req: FastifyRequest<{ Body: { ids: string[] } }>,
  reply: FastifyReply
) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({
        success: false,
        error: "No member IDs provided",
      });
    }

    const bigIntIds = ids.map((id: string) => BigInt(id));
    await prisma.member.updateMany({
      where: { id: { in: bigIntIds } },
      data: { deletedAt: new Date(), deletedBy: "admin" },
    });

    logger.info("Bulk soft-deleted %d members", ids.length);

    return reply.status(200).send({
      success: true,
      message: `${ids.length} members deleted.`,
    });
  } catch (error) {
    logger.error("Error bulk soft-deleting members:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to bulk soft-delete members",
    });
  }
}

export async function bulkRestoreMembersHandler(
  req: FastifyRequest<{ Body: { ids: string[] } }>,
  reply: FastifyReply
) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({
        success: false,
        error: "No member IDs provided",
      });
    }

    const bigIntIds = ids.map((id: string) => BigInt(id));
    await prisma.member.updateMany({
      where: { id: { in: bigIntIds } },
      data: { deletedAt: null, deletedBy: null },
    });

    logger.info("Bulk restored %d members", ids.length);

    return reply.status(200).send({
      success: true,
      message: `${ids.length} members restored.`,
    });
  } catch (error) {
    logger.error("Error bulk restoring members:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to bulk restore members",
    });
  }
}

export async function bulkPermanentDeleteMembersHandler(
  req: FastifyRequest<{ Body: { ids: string[] } }>,
  reply: FastifyReply
) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({
        success: false,
        error: "No member IDs provided",
      });
    }

    const bigIntIds = ids.map((id: string) => BigInt(id));

    // 1. Fetch records to get Cloudinary URLs
    const members = await prisma.member.findMany({
      where: { id: { in: bigIntIds } },
      select: { id: true, photoPath: true },
    });

    // 2. Delete from Cloudinary in parallel
    const deletePromises = members.map(async (m) => {
      if (m.photoPath) {
        const publicId = getCloudinaryPublicId(m.photoPath);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
            logger.info(`Destroyed Cloudinary asset: ${publicId}`);
          } catch (err) {
            logger.error(`Cloudinary deletion error for asset ${publicId}:`, err);
          }
        }
      }
    });
    await Promise.all(deletePromises);

    // 3. Delete from database
    await prisma.member.deleteMany({
      where: { id: { in: bigIntIds } },
    });

    logger.info("Bulk permanently deleted %d members", ids.length);

    return reply.status(200).send({
      success: true,
      message: `${ids.length} members permanently deleted.`,
    });
  } catch (error) {
    logger.error("Error bulk permanently deleting members:", error);
    return reply.status(500).send({
      success: false,
      error: "Failed to bulk permanently delete members",
    });
  }
}

