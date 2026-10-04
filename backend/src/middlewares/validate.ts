import { FastifyReply, FastifyRequest } from "fastify";
import { ZodSchema, ZodError } from "zod";
import { logger } from "../config/logger";

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationTargets) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        }));

        logger.error("Validation failure on %s %s: %o", req.method, req.url, {
          issues,
          body: req.body,
        });

        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: issues,
        });
      }

      logger.error("Unexpected validation parsing error:", err);
      return reply.status(500).send({
        success: false,
        error: "Internal validation error",
      });
    }
  };
}
