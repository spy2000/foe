import { FastifyInstance } from "fastify";
import {
  getNextMemberIdHandler,
  getMembersHandler,
  getMemberByIdHandler,
  createMemberHandler,
  updateMemberHandler,
  deleteMemberHandler,
  restoreMemberHandler,
  permanentDeleteMemberHandler,
  bulkSoftDeleteMembersHandler,
  bulkRestoreMembersHandler,
  bulkPermanentDeleteMembersHandler,
} from "../controllers/member.controller";
import { validate } from "../middlewares/validate";
import { optionalAuth, requireAddMemberPermission } from "../middlewares/auth.middleware";
import {
  createMemberSchema,
  CreateMemberInput,
  updateMemberSchema,
  UpdateMemberInput,
} from "../schemas/member.schema";

export async function memberRoutes(fastify: FastifyInstance) {
  // Populate req.user from auth token if present
  fastify.addHook("preHandler", optionalAuth);

  fastify.get("/members/next-id", getNextMemberIdHandler);
  fastify.get("/members", getMembersHandler);

  // Bulk operation endpoints (registered before :id to prevent param collision)
  fastify.post<{ Body: { ids: string[] } }>(
    "/members/bulk-delete",
    { preHandler: [requireAddMemberPermission] },
    bulkSoftDeleteMembersHandler
  );
  fastify.post<{ Body: { ids: string[] } }>(
    "/members/bulk-restore",
    { preHandler: [requireAddMemberPermission] },
    bulkRestoreMembersHandler
  );
  fastify.post<{ Body: { ids: string[] } }>(
    "/members/bulk-permanent-delete",
    { preHandler: [requireAddMemberPermission] },
    bulkPermanentDeleteMembersHandler
  );

  fastify.get("/members/:id", getMemberByIdHandler);

  fastify.post<{ Body: CreateMemberInput }>(
    "/members",
    {
      preHandler: [requireAddMemberPermission, validate({ body: createMemberSchema })],
    },
    createMemberHandler
  );

  fastify.put<{ Params: { id: string }; Body: UpdateMemberInput }>(
    "/members/:id",
    {
      preHandler: [requireAddMemberPermission, validate({ body: updateMemberSchema })],
    },
    updateMemberHandler
  );

  fastify.patch<{ Params: { id: string }; Body: UpdateMemberInput }>(
    "/members/:id",
    {
      preHandler: [requireAddMemberPermission, validate({ body: updateMemberSchema })],
    },
    updateMemberHandler
  );

  fastify.delete<{ Params: { id: string } }>(
    "/members/:id",
    { preHandler: [requireAddMemberPermission] },
    deleteMemberHandler
  );

  fastify.patch<{ Params: { id: string } }>(
    "/members/:id/restore",
    { preHandler: [requireAddMemberPermission] },
    restoreMemberHandler
  );

  fastify.delete<{ Params: { id: string } }>(
    "/members/:id/permanent",
    { preHandler: [requireAddMemberPermission] },
    permanentDeleteMemberHandler
  );
}
