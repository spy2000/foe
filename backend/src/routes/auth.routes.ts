import { FastifyInstance } from "fastify";
import {
  loginHandler,
  updatePasswordHandler,
  changePasswordHandler,
  getMeHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  loginSchema,
  LoginInput,
  updatePasswordSchema,
  UpdatePasswordInput,
  forgotPasswordSchema,
  ForgotPasswordInput,
  resetPasswordSchema,
  ResetPasswordInput,
  changePasswordSchema,
  ChangePasswordInput,
} from "../schemas/auth.schema";

export async function authRoutes(fastify: FastifyInstance) {
  // Login with rate limiting (5 requests per 15 minutes) and input validation
  fastify.post<{ Body: LoginInput }>(
    "/auth/login",
    {
      preHandler: [authLimiter, validate({ body: loginSchema })],
    },
    loginHandler
  );

  // Update password (requires authenticated session)
  fastify.post<{ Body: UpdatePasswordInput }>(
    "/auth/update-password",
    {
      preHandler: [requireAuth, validate({ body: updatePasswordSchema })],
    },
    updatePasswordHandler
  );

  // Voluntary password change (requires authenticated session)
  fastify.patch<{ Body: ChangePasswordInput }>(
    "/auth/change-password",
    {
      preHandler: [requireAuth, validate({ body: changePasswordSchema })],
    },
    changePasswordHandler
  );

  // Forgot password (rate limited to prevent email flooding)
  fastify.post<{ Body: ForgotPasswordInput }>(
    "/auth/forgot-password",
    {
      preHandler: [authLimiter, validate({ body: forgotPasswordSchema })],
    },
    forgotPasswordHandler
  );

  // Reset password via token
  fastify.post<{ Body: ResetPasswordInput }>(
    "/auth/reset-password",
    {
      preHandler: [authLimiter, validate({ body: resetPasswordSchema })],
    },
    resetPasswordHandler
  );

  // Get current logged-in user profile
  fastify.get(
    "/auth/me",
    {
      preHandler: [requireAuth],
    },
    getMeHandler
  );

  // Logout (clears HttpOnly cookie)
  fastify.post("/auth/logout", logoutHandler);
}
