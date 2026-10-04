import { FastifyInstance } from "fastify";
import { uploadImageHandler, proxyImageHandler } from "../controllers/upload.controller";

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post("/upload", uploadImageHandler);
  fastify.get("/proxy-image", proxyImageHandler);
}
