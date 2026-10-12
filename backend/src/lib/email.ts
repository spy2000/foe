import axios from "axios";
import { logger } from "../config/logger";

export interface SendEmailResult {
  messageId?: string;
  [key: string]: unknown;
}

export const sendBrevoEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ data: SendEmailResult }> => {
  const apiKey = process.env.BREVO_API_KEY;
  const systemEmail = process.env.SYSTEM_EMAIL || "admin@friendsofeducation.in";

  if (!apiKey) {
    logger.warn(
      `[Brevo Service] BREVO_API_KEY is not configured. Email to ${to} with subject "${subject}" suppressed.`
    );
    return { data: { messageId: "mock-suppressed-id" } };
  }

  return axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "ID Portal Admin", email: systemEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );
};
