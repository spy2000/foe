import { FastifyCorsOptions } from "@fastify/cors";

const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");

export const corsOptions: FastifyCorsOptions = {
  // In production, strictly match the exact frontend URL (e.g., https://foe-portal.vercel.app, no wildcards or trailing slashes)
  // In development, also permit local addresses for flexible testing
  origin: isProduction
    ? frontendUrl
    : [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true, // CRITICAL: Allows the browser to send and receive HttpOnly cross-domain cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
};
