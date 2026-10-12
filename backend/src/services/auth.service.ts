import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { FastifyReply } from "fastify";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { AuthTokenPayload, SafeUser } from "../types/auth";

export const AUTH_COOKIE_NAME = "foe_auth_token";

const JWT_SECRET =
  process.env.JWT_SECRET || "foe_jwt_secret_super_key_2026_secure_random";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  maxAge: number;
}

export const getAuthCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 60 * 60 * 24, // 24 hours in seconds
});

export class AuthService {
  /**
   * Hashes a plain password using bcryptjs.
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compares a plain password against a bcrypt hash.
   */
  static async comparePassword(
    plain: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Generates a signed JWT for the authenticated user.
   */
  static generateToken(payload: AuthTokenPayload): string {
    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN,
    };
    return jwt.sign(payload, JWT_SECRET, signOptions);
  }

  /**
   * Verifies a JWT and returns the typed payload or null if invalid/expired.
   */
  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      if (!decoded || !decoded.userId) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Sets a secure HttpOnly cookie containing the JWT on the FastifyReply.
   */
  static setAuthCookie(reply: FastifyReply, token: string): void {
    const options = getAuthCookieOptions();
    reply.setCookie(AUTH_COOKIE_NAME, token, options);
  }

  /**
   * Clears the authentication cookie from the FastifyReply.
   */
  static clearAuthCookie(reply: FastifyReply): void {
    reply.clearCookie(AUTH_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }

  /**
   * Fetches an active user by ID and strips the password hash.
   */
  static async findActiveUserById(
    userId: string
  ): Promise<{ user: SafeUser | null; isDeactivated: boolean; status: UserStatus | null }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { user: null, isDeactivated: false, status: null };
    }

    if (user.status === UserStatus.DEACTIVATED || user.deletedAt !== null) {
      return { user: null, isDeactivated: true, status: user.status };
    }

    // Allow ACTIVE and INVITED users to authenticate (INVITED users must be able to call /auth/me and /auth/update-password)
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, isDeactivated: false, status: user.status };
  }

  /**
   * Password complexity validator:
   * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
   */
  static validatePasswordComplexity(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number.");
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push("Password must contain at least one special character.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
