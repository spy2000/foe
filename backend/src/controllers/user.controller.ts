import crypto from "crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma, UserStatus, Role } from "@prisma/client";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { AuthService } from "../services/auth.service";
import {
  InviteUserInput,
  UpdatePermissionsInput,
  UpdateStatusInput,
  UpdateRoleInput,
  UpdateUserInput,
  BulkDeleteUsersInput,
} from "../schemas/user.schema";

function generateTemporaryPassword(length: number = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  // Ensure it satisfies complexity: uppercase, lowercase, number, special char
  if (
    !/[A-Z]/.test(result) ||
    !/[a-z]/.test(result) ||
    !/[0-9]/.test(result) ||
    !/[!@#$%]/.test(result)
  ) {
    return generateTemporaryPassword(length);
  }
  return result;
}

interface GetUsersQuery {
  cursor?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export async function getUsersHandler(
  req: FastifyRequest<{ Querystring: GetUsersQuery }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { cursor, limit, search, sortBy, sortOrder } = req.query;
    const takeLimit = Math.min(limit ? parseInt(limit, 10) : 10, 50);

    // 1. Build Search Filter
    const where: Prisma.UserWhereInput = {
      deletedAt: null, // CRITICAL: Hide soft-deleted users
    };
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { contactNumber: { contains: term, mode: "insensitive" } },
      ];
    }

    // 2. Whitelist sort fields
    const ALLOWED_SORT_FIELDS: Record<string, string> = {
      name: "name",
      email: "email",
      role: "role",
      status: "status",
      createdat: "createdAt",
      updatedat: "updatedAt",
      id: "id",
    };

    const requestedKey = (sortBy || "createdAt").toLowerCase().replace(/_/g, "");
    const safeSortField = ALLOWED_SORT_FIELDS[requestedKey] || "createdAt";
    const safeSortOrder = sortOrder?.toLowerCase() === "asc" ? "asc" : "desc";

    const orderBy: Prisma.UserOrderByWithRelationInput[] = [
      { [safeSortField]: safeSortOrder },
    ];
    if (safeSortField !== "id") {
      orderBy.push({ id: safeSortOrder });
    }

    // 3. Fetch Data (take + 1 to check for next page)
    const queryOptions: Prisma.UserFindManyArgs = {
      where,
      take: takeLimit + 1,
      orderBy,
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        canAddMember: true,
        canDownloadCard: true,
        viewScope: true,
        createdAt: true,
        updatedAt: true,
      },
    };

    if (cursor && typeof cursor === "string") {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1;
    }

    const users = await prisma.user.findMany(queryOptions);

    // 4. Determine next cursor
    let nextCursor: string | undefined = undefined;
    const hasMore = users.length > takeLimit;
    if (hasMore) {
      const nextItem = users.pop();
      nextCursor = nextItem ? nextItem.id : undefined;
    }

    return reply.status(200).send({
      success: true,
      data: users,
      nextCursor,
      hasMore,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Error fetching users list:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Error fetching users list: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unknown error occurred",
    });
  }
}

export async function inviteUserHandler(
  req: FastifyRequest<{ Body: InviteUserInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const body: InviteUserInput = req.body;
    const { email, name, contactNumber, role, canAddMember, canDownloadCard, viewScope } = body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Generate secure 12-char random alphanumeric password
    const plaintextPassword = generateTemporaryPassword(12);
    const passwordHash = await AuthService.hashPassword(plaintextPassword);

    if (existing) {
      if (existing.deletedAt !== null) {
        // User was soft-deleted. Restore them with new permissions and new temp password.
        const restoredUser = await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            name: name.trim(),
            contactNumber: contactNumber?.trim() || null,
            role: role || Role.ADMIN,
            canAddMember: canAddMember ?? true,
            canDownloadCard: canDownloadCard ?? true,
            viewScope: viewScope || "ALL",
            passwordHash,
            status: UserStatus.INVITED,
            forcePasswordChange: true,
            deletedAt: null, // RESTORE
          },
          select: {
            id: true,
            email: true,
            name: true,
            contactNumber: true,
            role: true,
            status: true,
            forcePasswordChange: true,
            canAddMember: true,
            canDownloadCard: true,
            viewScope: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        logger.info(`Soft-deleted user restored and re-invited: ${restoredUser.email} (${restoredUser.id})`);

        return reply.status(200).send({
          success: true,
          message: "Administrator restored successfully",
          password: plaintextPassword,
          data: {
            user: restoredUser,
            temporaryPassword: plaintextPassword,
          },
        });
      }

      // User is active/invited/deactivated but NOT deleted.
      return reply.status(400).send({
        success: false,
        error: "A user with this email address already exists in the active directory.",
      });
    }

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        contactNumber: contactNumber?.trim() || null,
        passwordHash,
        role: role || Role.ADMIN,
        status: UserStatus.INVITED,
        forcePasswordChange: true,
        canAddMember: canAddMember ?? true,
        canDownloadCard: canDownloadCard ?? true,
        viewScope: viewScope || "ALL",
      },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        canAddMember: true,
        canDownloadCard: true,
        viewScope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User successfully invited: ${newUser.email} (${newUser.id})`);

    // Return plaintext password only this one time
    return reply.status(201).send({
      success: true,
      message: "User invited successfully",
      data: {
        user: newUser,
        temporaryPassword: plaintextPassword,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Invite user error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Invite user error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unknown error occurred",
    });
  }
}

export async function updatePermissionsHandler(
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdatePermissionsInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = req.params;
    const body: UpdatePermissionsInput = req.body;
    const { canAddMember, canDownloadCard, viewScope } = body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(canAddMember !== undefined ? { canAddMember } : {}),
        ...(canDownloadCard !== undefined ? { canDownloadCard } : {}),
        ...(viewScope !== undefined ? { viewScope } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        canAddMember: true,
        canDownloadCard: true,
        viewScope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Permissions updated for user: ${updatedUser.email} (${id})`);

    return reply.status(200).send({
      success: true,
      data: updatedUser,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Update permissions error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Update permissions error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unknown error occurred",
    });
  }
}

export async function updateStatusHandler(
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateStatusInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = req.params;
    const body: UpdateStatusInput = req.body;
    const { status } = body;

    // Self-lockout prevention
    if (req.user?.id === id) {
      return reply.status(400).send({
        success: false,
        error: "Self-lockout prevented: You cannot deactivate your own account.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        canAddMember: true,
        canDownloadCard: true,
        viewScope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Status updated for user ${updatedUser.email}: ${status}`);

    return reply.status(200).send({
      success: true,
      data: updatedUser,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Update status error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Update status error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unknown error occurred",
    });
  }
}

export async function updateRoleHandler(
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateRoleInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = req.params;
    const body: UpdateRoleInput = req.body;
    const { role } = body;

    // Self-lockout prevention
    if (req.user?.id === id) {
      return reply.status(400).send({
        success: false,
        error: "Self-lockout prevented: You cannot modify your own role.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        canAddMember: true,
        canDownloadCard: true,
        viewScope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Role updated for user ${updatedUser.email}: ${role}`);

    return reply.status(200).send({
      success: true,
      data: updatedUser,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Update role error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Update role error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unknown error occurred",
    });
  }
}

export async function updateUserHandler(
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateUserInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = req.params;
    const body = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    // Prevent modifying own role or deactivating self
    if (req.user?.id === id) {
      if (body.role && body.role !== user.role) {
        return reply.status(400).send({
          success: false,
          error: "Self-lockout prevented: You cannot modify your own role.",
        });
      }
      if (body.status && body.status === UserStatus.DEACTIVATED) {
        return reply.status(400).send({
          success: false,
          error: "Self-lockout prevented: You cannot deactivate your own account.",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.contactNumber !== undefined ? { contactNumber: body.contactNumber } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.canAddMember !== undefined ? { canAddMember: body.canAddMember } : {}),
        ...(body.canDownloadCard !== undefined ? { canDownloadCard: body.canDownloadCard } : {}),
        ...(body.viewScope !== undefined ? { viewScope: body.viewScope } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        contactNumber: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        canAddMember: true,
        canDownloadCard: true,
        viewScope: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`User updated: ${updatedUser.email} (${updatedUser.id})`);

    return reply.status(200).send({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Update user error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Update user error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unknown error occurred",
    });
  }
}

export async function softDeleteUserHandler(
  req: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = req.params;

    const userToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!userToDelete) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    if (userToDelete.role === "SUPERADMIN") {
      return reply.status(403).send({
        success: false,
        error: "Cannot delete the Superadmin.",
      });
    }

    if (req.user?.id === id) {
      return reply.status(400).send({
        success: false,
        error: "Cannot delete your own account.",
      });
    }

    await prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.DEACTIVATED,
        deletedAt: new Date(), // Set soft delete timestamp
      },
    });

    logger.info(`User soft-deleted: ${userToDelete.email} (${id})`);

    return reply.status(200).send({
      success: true,
      message: "Administrator deleted successfully.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Delete user error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Delete user error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "Failed to delete user.",
    });
  }
}

export async function bulkDeleteUsersHandler(
  req: FastifyRequest<{
    Body: BulkDeleteUsersInput;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { ids } = req.body;
    const currentUserId = req.user?.id;

    // Filter out Superadmin and current user
    const usersToDeactivate = await prisma.user.findMany({
      where: {
        id: { in: ids },
        role: { not: Role.SUPERADMIN },
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
      },
      select: { id: true },
    });

    const targetIds = usersToDeactivate.map((u) => u.id);

    if (targetIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: "No eligible users found to delete. Superadmins and your own account cannot be deleted.",
      });
    }

    const result = await prisma.user.updateMany({
      where: {
        id: { in: targetIds },
      },
      data: {
        status: UserStatus.DEACTIVATED,
        deletedAt: new Date(),
      },
    });

    logger.info(`Bulk deleted ${result.count} users`);

    return reply.status(200).send({
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} administrator(s).`,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Bulk delete users error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Bulk delete users error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "Failed to bulk delete users.",
    });
  }
}
