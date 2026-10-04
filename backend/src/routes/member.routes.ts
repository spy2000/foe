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
import {
  createMemberSchema,
  CreateMemberInput,
  updateMemberSchema,
  UpdateMemberInput,
} from "../schemas/member.schema";

export async function memberRoutes(fastify: FastifyInstance) {
  fastify.get("/members/next-id", getNextMemberIdHandler);
  fastify.get("/members", getMembersHandler);

  // Bulk operation endpoints (registered before :id to prevent param collision)
  fastify.post("/members/bulk-delete", bulkSoftDeleteMembersHandler);
  fastify.post("/members/bulk-restore", bulkRestoreMembersHandler);
  fastify.post("/members/bulk-permanent-delete", bulkPermanentDeleteMembersHandler);

  fastify.get("/members/:id", getMemberByIdHandler);
  fastify.post<{ Body: CreateMemberInput }>(
    "/members",
    {
      preHandler: [validate({ body: createMemberSchema })],
    },
    createMemberHandler
  );
  fastify.put<{ Params: { id: string }; Body: UpdateMemberInput }>(
    "/members/:id",
    {
      preHandler: [validate({ body: updateMemberSchema })],
    },
    updateMemberHandler
  );
  fastify.delete("/members/:id", deleteMemberHandler);
  fastify.patch("/members/:id/restore", restoreMemberHandler);
  fastify.delete("/members/:id/permanent", permanentDeleteMemberHandler);
}
