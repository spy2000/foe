import { z } from "zod";
import { Role, UserStatus, ViewScope } from "@prisma/client";

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters long"),
  contactNumber: z.string().optional().nullable(),
  role: z.nativeEnum(Role).default(Role.ADMIN),
  canAddMember: z.boolean().default(true),
  canDownloadCard: z.boolean().default(true),
  viewScope: z.nativeEnum(ViewScope).default(ViewScope.ALL),
});

export const updatePermissionsSchema = z.object({
  canAddMember: z.boolean().optional(),
  canDownloadCard: z.boolean().optional(),
  viewScope: z.nativeEnum(ViewScope).optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long").optional(),
  contactNumber: z.string().optional().nullable(),
  role: z.nativeEnum(Role).optional(),
  canAddMember: z.boolean().optional(),
  canDownloadCard: z.boolean().optional(),
  viewScope: z.nativeEnum(ViewScope).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const bulkDeleteUsersSchema = z.object({
  ids: z.array(z.string().uuid().or(z.string())).min(1, "At least one user ID is required"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BulkDeleteUsersInput = z.infer<typeof bulkDeleteUsersSchema>;
