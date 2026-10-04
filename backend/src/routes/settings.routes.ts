import { FastifyInstance } from "fastify";
import {
  getSettingsHandler,
  updateSettingsHandler,
} from "../controllers/settings.controller";
import { validate } from "../middlewares/validate";
import { updateSettingsSchema, UpdateSettingsInput } from "../schemas/settings.schema";

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get("/settings", getSettingsHandler);
  fastify.put<{ Body: UpdateSettingsInput }>(
    "/settings",
    {
      preHandler: [validate({ body: updateSettingsSchema })],
    },
    updateSettingsHandler
  );
}
