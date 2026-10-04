import { FastifyCorsOptions } from "@fastify/cors";

export const corsOptions: FastifyCorsOptions = {
  origin: true, // Allow frontend requests from any origin or configured FRONTEND_URL
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};
