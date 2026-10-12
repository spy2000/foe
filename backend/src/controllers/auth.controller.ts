import crypto from "crypto";
import axios from "axios";
import { FastifyReply, FastifyRequest } from "fastify";
import { UserStatus } from "@prisma/client";
import { prisma } from "../config/db";
import { logger } from "../config/logger";
import { AuthService } from "../services/auth.service";
import {
  LoginInput,
  UpdatePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from "../schemas/auth.schema";
import { sendBrevoEmail } from "../lib/email";

export { cookieOptions, isProduction } from "../services/auth.service";

export async function loginHandler(
  req: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (user.status === UserStatus.DEACTIVATED || user.deletedAt !== null) {
      return reply.status(403).send({
        success: false,
        error: "Your account has been deactivated. Please contact an administrator.",
      });
    }

    const isMatch = await AuthService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Issue JWT and set HttpOnly cookie
    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    AuthService.setAuthCookie(reply, token);

    logger.info(`User logged in successfully: ${user.email} (${user.id})`);

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      contactNumber: user.contactNumber,
      role: user.role,
      status: user.status,
      forcePasswordChange: user.forcePasswordChange,
      canAddMember: user.canAddMember,
      canDownloadCard: user.canDownloadCard,
      viewScope: user.viewScope,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return reply.status(200).send({
      success: true,
      message: "Login successful",
      requiresPasswordChange: user.forcePasswordChange,
      data: {
        user: safeUser,
        requiresPasswordChange: user.forcePasswordChange,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Login error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Login error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "An unexpected error occurred during login. Please try again.",
    });
  }
}

export async function updatePasswordHandler(
  req: FastifyRequest<{ Body: UpdatePasswordInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: "Authentication required",
      });
    }

    const { oldPassword, newPassword } = req.body;

    // Fetch user from DB with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    // INDUSTRY STANDARD: Only verify the old password if this is a voluntary change.
    // If forcePasswordChange is true, they just logged in with the temp password, so we trust the session.
    if (!user.forcePasswordChange) {
      if (!oldPassword) {
        return reply.status(400).send({
          success: false,
          error: "Current password is required.",
        });
      }

      const isCurrentValid = await AuthService.comparePassword(
        oldPassword,
        user.passwordHash
      );

      if (!isCurrentValid) {
        return reply.status(401).send({
          success: false,
          error: "Current password is incorrect.",
        });
      }
    }

    // Validate new password complexity
    const complexity = AuthService.validatePasswordComplexity(newPassword);
    if (!complexity.isValid) {
      return reply.status(400).send({
        success: false,
        error: complexity.errors[0] || "New password does not meet security requirements",
        details: complexity.errors,
      });
    }

    // Ensure new password differs from old password
    const isSameAsOld = await AuthService.comparePassword(
      newPassword,
      user.passwordHash
    );
    if (isSameAsOld) {
      return reply.status(400).send({
        success: false,
        error: "New password must be different from current password",
      });
    }

    // Hash and update
    const newHash = await AuthService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        forcePasswordChange: false,
        status: user.status === UserStatus.INVITED ? UserStatus.ACTIVE : user.status,
      },
    });

    logger.info(`Password successfully updated for user: ${user.email} (${user.id})`);

    return reply.status(200).send({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Update password error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Update password error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "Failed to update password",
    });
  }
}

export async function changePasswordHandler(
  req: FastifyRequest<{ Body: ChangePasswordInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: "Authentication required",
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: "User not found",
      });
    }

    // INDUSTRY STANDARD CHECK:
    if (user.forcePasswordChange) {
      // Flow 1: First-time setup. Trust the session, ignore currentPassword.
      if (!newPassword) {
        return reply.status(400).send({
          success: false,
          error: "New password is required.",
        });
      }
    } else {
      // Flow 2: Voluntary change. STRICTLY require currentPassword.
      if (!currentPassword) {
        return reply.status(400).send({
          success: false,
          error: "Current password is required.",
        });
      }

      const isValid = await AuthService.comparePassword(
        currentPassword,
        user.passwordHash
      );

      if (!isValid) {
        return reply.status(401).send({
          success: false,
          error: "Current password is incorrect.",
        });
      }
    }

    // Verify new password is not identical to current password
    const isSameAsOld = await AuthService.comparePassword(
      newPassword,
      user.passwordHash
    );
    if (isSameAsOld) {
      return reply.status(400).send({
        success: false,
        error: "New password must be different from current password",
      });
    }

    // Bcrypt hash the new password
    const newHash = await AuthService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        forcePasswordChange: false,
        status: UserStatus.ACTIVE,
      },
    });

    logger.info(`Voluntary password change successful for user: ${user.email} (${user.id})`);

    return reply.status(200).send({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Change password error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Change password error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "Failed to change password",
    });
  }
}

export async function getMeHandler(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!req.user) {
    return reply.status(401).send({
      success: false,
      error: "Not authenticated",
    });
  }

  return reply.status(200).send({
    success: true,
    data: req.user,
  });
}

export async function logoutHandler(
  _req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  AuthService.clearAuthCookie(reply);
  return reply.status(200).send({
    success: true,
    message: "Logged out successfully",
  });
}

export async function forgotPasswordHandler(
  req: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return reply.status(404).send({ error: "Email address not registered." });
    }

    // INDUSTRY STANDARD: Do not allow deactivated users to reset passwords.
    if (user.status === UserStatus.DEACTIVATED || user.deletedAt !== null) {
      return reply.status(403).send({
        error: "Your account is deactivated. You cannot reset your password.",
      });
    }

    // INDUSTRY STANDARD: Do not allow INVITED users to use Forgot Password. 
    // They must use their initial temporary password to activate their account.
    if (user.status === UserStatus.INVITED || user.forcePasswordChange) {
      return reply.status(403).send({
        error: "Your account setup is incomplete. Please log in with your temporary password.",
      });
    }

    if (!process.env.BREVO_API_KEY) {
      console.error("[Email Dispatch Failed]: BREVO_API_KEY is missing in environment variables.");
      return reply.status(500).send({
        error: "Email service is unconfigured. Please contact the administrator.",
      });
    }

    // 3. Generate token & Save
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <h2 style="color: #ea580c;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>We received a request to reset your password for the Friends of Education Admin Portal.</p>
        <p style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #666; font-size: 13px;">This link will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const textContent = `Hello ${user.name},\n\nYou have requested a password reset for the Friends of Education Admin Portal.\n\nPlease use the following link to reset your password (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`;

    // 4. Wrap email call in its own try/catch to isolate the failure
    try {
      // AWAIT the response. Use a 30-second timeout (30000ms)
      const emailResponse = await axios.post<{ messageId?: string }>(
        "https://api.brevo.com/v3/smtp/email",
        {
          sender: {
            name: "ID Portal Admin",
            email: process.env.SYSTEM_EMAIL || "admin@friendsofeducation.in",
          },
          to: [{ email: user.email }],
          subject: "Password Reset Request - ID Card Portal",
          // 1. Plain text fallback is required by many strict spam filters
          textContent,
          // 2. The HTML version
          htmlContent,
          // 3. Tag the email so we can filter it in the Brevo Dashboard logs
          tags: ["forgot-password", "auth"],
        },
        {
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 30000,
        }
      );

      // Verify Brevo actually created a Message ID
      if (!emailResponse.data || !emailResponse.data.messageId) {
        console.error(
          "[Brevo Warning]: API returned success, but no MessageId was generated.",
          emailResponse.data
        );
        return reply.status(500).send({
          error:
            "Email server accepted the request but failed to queue the message. Check sender verification.",
        });
      }

      console.log(
        `[Brevo API Accept] Payload received by Brevo. Message ID: ${emailResponse.data.messageId}`
      );
      console.log(
        `⚠️ NOTE: If email does not arrive, check Brevo Dashboard -> Transactional Logs for Message ID: ${emailResponse.data.messageId}`
      );
      return reply.status(200).send({
        message: "Password reset email sent successfully.",
      });
    } catch (emailError: unknown) {
      let statusCode: number | string = "Timeout/Network";
      let errorMessage = "Failed to send reset email.";

      if (axios.isAxiosError(emailError)) {
        statusCode = emailError.response?.status || "Timeout/Network";
        const resData = emailError.response?.data as { message?: string } | undefined;
        errorMessage = resData?.message || emailError.message;
      } else if (emailError instanceof Error) {
        errorMessage = emailError.message;
      }

      // Explicit failure logging with status codes
      console.error(`[Email Dispatch Failed] (Status: ${statusCode}):`, errorMessage);

      return reply.status(500).send({
        error: "Failed to send reset email. Please try again later or contact support.",
      });
    }

    return reply.status(200).send({
      message: "Password reset email sent successfully.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Forgot Password Fatal Error]:", err.stack || err.message);
    return reply.status(500).send({
      error: "An unexpected error occurred. Please try again.",
    });
  }
}

export async function resetPasswordHandler(
  req: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: "Password reset link is invalid or has expired.",
      });
    }

    if (user.status === UserStatus.DEACTIVATED) {
      return reply.status(403).send({
        success: false,
        error: "Account has been deactivated.",
      });
    }

    const complexity = AuthService.validatePasswordComplexity(newPassword);
    if (!complexity.isValid) {
      return reply.status(400).send({
        success: false,
        error: "Password does not meet complexity requirements",
        details: complexity.errors,
      });
    }

    const newHash = await AuthService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        forcePasswordChange: false,
        status: user.status === UserStatus.INVITED ? UserStatus.ACTIVE : user.status,
      },
    });

    logger.info(`Password successfully reset for user: ${user.email}`);

    return reply.status(200).send({
      success: true,
      message: "Password reset successfully. You may now log in with your new password.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error("Reset password error:", error.message);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
    logger.error("Reset password error: An unknown error occurred");
    return reply.status(500).send({
      success: false,
      error: "Failed to reset password. Please try again.",
    });
  }
}
