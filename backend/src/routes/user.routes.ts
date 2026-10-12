import { FastifyInstance } from "fastify";
import {
  getUsersHandler,
  inviteUserHandler,
  updatePermissionsHandler,
  updateStatusHandler,
  updateRoleHandler,
  updateUserHandler,
  softDeleteUserHandler,
  bulkDeleteUsersHandler,
} from "../controllers/user.controller";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  inviteUserSchema,
  updatePermissionsSchema,
  updateStatusSchema,
  updateRoleSchema,
  updateUserSchema,
  bulkDeleteUsersSchema,
  InviteUserInput,
  UpdatePermissionsInput,
  UpdateStatusInput,
  UpdateRoleInput,
  UpdateUserInput,
  BulkDeleteUsersInput,
} from "../schemas/user.schema";

export async function userRoutes(fastify: FastifyInstance) {
  // All user management routes require Superadmin role
  fastify.addHook("preHandler", requireAuth);
  fastify.addHook("preHandler", requireSuperAdmin);

  // List all users
  fastify.get("/users", getUsersHandler);

  // Invite new admin user
  fastify.post<{ Body: InviteUserInput }>(
    "/users/invite",
    {
      preHandler: [validate({ body: inviteUserSchema })],
    },
    inviteUserHandler
  );

  // Update entire user profile/permissions/role
  fastify.patch<{
    Params: { id: string };
    Body: UpdateUserInput;
  }>(
    "/users/:id",
    {
      preHandler: [validate({ body: updateUserSchema })],
    },
    updateUserHandler
  );

  // Soft delete user (DELETE /users/:id)
  fastify.delete<{
    Params: { id: string };
  }>("/users/:id", softDeleteUserHandler);

  // Bulk delete users (POST /users/bulk-delete)
  fastify.post<{
    Body: BulkDeleteUsersInput;
  }>(
    "/users/bulk-delete",
    {
      preHandler: [validate({ body: bulkDeleteUsersSchema })],
    },
    bulkDeleteUsersHandler
  );

  // Update permissions
  fastify.patch<{
    Params: { id: string };
    Body: UpdatePermissionsInput;
  }>(
    "/users/:id/permissions",
    {
      preHandler: [validate({ body: updatePermissionsSchema })],
    },
    updatePermissionsHandler
  );

  // Update status (ACTIVE / DEACTIVATED)
  fastify.patch<{
    Params: { id: string };
    Body: UpdateStatusInput;
  }>(
    "/users/:id/status",
    {
      preHandler: [validate({ body: updateStatusSchema })],
    },
    updateStatusHandler
  );

  // Update role (SUPERADMIN / ADMIN)
  fastify.patch<{
    Params: { id: string };
    Body: UpdateRoleInput;
  }>(
    "/users/:id/role",
    {
      preHandler: [validate({ body: updateRoleSchema })],
    },
    updateRoleHandler
  );
}
