import { User, Role, UserStatus, ViewScope } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

export interface UserPermissions {
  canAddMember: boolean;
  canDownloadCard: boolean;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: Role;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: SafeUser;
  }
}
