import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { Role, UserStatus } from "@prisma/client";
import { AuthService, AUTH_COOKIE_NAME } from "../services/auth.service";
import { SafeUser, UserPermissions } from "../types/auth";

/**
 * Extracts the JWT token from HttpOnly cookie or Authorization Bearer header.
 */
function extractToken(req: FastifyRequest): string | null {
  // 1. Prioritize secure HttpOnly cookie
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Fallback to Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Guardian Middleware: requireAuth
 * Verifies the JWT from cookie/header.
 * Fetches user from DB to ensure status === 'ACTIVE'.
 * If DEACTIVATED, immediately clears the cookie and throws 403 Forbidden.
 */
export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: "Authentication required. Please log in.",
    });
  }

  const payload = AuthService.verifyToken(token);
  if (!payload) {
    AuthService.clearAuthCookie(reply);
    return reply.status(401).send({
      success: false,
      error: "Session expired or invalid. Please log in again.",
    });
  }

  const { user, isDeactivated } = await AuthService.findActiveUserById(
    payload.userId
  );

  if (isDeactivated || user?.status === UserStatus.DEACTIVATED) {
    AuthService.clearAuthCookie(reply);
    reply.clearCookie("token");
    return reply.status(403).send({
      success: false,
      error: "Your account has been deactivated. Please contact the Superadmin.",
    });
  }

  if (!user) {
    AuthService.clearAuthCookie(reply);
    return reply.status(401).send({
      success: false,
      error: "User account not found.",
    });
  }

  // CRITICAL FIX: Do not block INVITED/forcePasswordChange users here.
  // Let the frontend read the user object from /auth/me to redirect them to /update-password.
  // Attach safe user to the request
  req.user = user;
}

/**
 * Guardian Middleware: requirePermissions
 * Composable permission gate.
 * SuperAdmin automatically bypasses specific boolean checks.
 * Admin must have every requested boolean permission set to true.
 */
export function requirePermissions(
  permissions: (keyof UserPermissions | string)[]
) {
  return async function permissionsPreHandler(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!req.user) {
      await requireAuth(req, reply);
      if (reply.sent) return;
    }

    const currentUser = req.user as SafeUser;

    // SuperAdmin always has full permissions
    if (currentUser.role === Role.SUPERADMIN) {
      return;
    }

    const missingPermissions: string[] = [];

    for (const permission of permissions) {
      const hasPermission = Boolean(
        (currentUser as unknown as Record<string, unknown>)[permission]
      );
      if (!hasPermission) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      return reply.status(403).send({
        success: false,
        error: `Forbidden: Missing required permissions (${missingPermissions.join(", ")})`,
      });
    }
  };
}

/**
 * Guardian Middleware: requireSuperAdmin
 * Strictly checks that req.user.role === 'SUPERADMIN'.
 */
export async function requireSuperAdmin(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!req.user) {
    await requireAuth(req, reply);
    if (reply.sent) return;
  }

  if (req.user?.role !== Role.SUPERADMIN) {
    return reply.status(403).send({
      success: false,
      error: "Forbidden: Superadmin access required.",
    });
  }
}

/**
 * Optional Auth Hook:
 * Extracts user if valid cookie/header present, but allows request to continue if unauthenticated.
 */
export async function optionalAuth(
  req: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const token = extractToken(req);
  if (!token) return;

  const payload = AuthService.verifyToken(token);
  if (!payload) return;

  const { user } = await AuthService.findActiveUserById(payload.userId);
  if (user) {
    req.user = user;
  }
}

/**
 * Granular Permission Guard: requireAddMemberPermission
 * Enforces canAddMember for Admins. SuperAdmins automatically pass.
 */
export async function requireAddMemberPermission(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!req.user) {
    await requireAuth(req, reply);
    if (reply.sent) return;
  }

  if (!req.user?.canAddMember && req.user?.role !== Role.SUPERADMIN) {
    return reply.status(403).send({
      success: false,
      error: "You do not have permission to add or edit members.",
    });
  }
}

/**
 * Granular Permission Guard: requireDownloadPermission
 * Enforces canDownloadCard for Admins. SuperAdmins automatically pass.
 */
export async function requireDownloadPermission(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!req.user) {
    await requireAuth(req, reply);
    if (reply.sent) return;
  }

  if (!req.user?.canDownloadCard && req.user?.role !== Role.SUPERADMIN) {
    return reply.status(403).send({
      success: false,
      error: "You do not have permission to download ID cards.",
    });
  }
}
