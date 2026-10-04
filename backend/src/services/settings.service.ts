import { prisma } from "../config/db";

export interface UpdateSettingsDTO {
  trustName?: string;
  trustSubtitle?: string;
  registrationNo?: string;
  logoUrl?: string;
  signatureUrl?: string;
  websiteUrl?: string;
  aboutUsText?: string;
  validityClause?: string;
  returnNote?: string;
  defaultEmergencyContact?: string;
  defaultAuthorisedName?: string;
  defaultAuthorisedDesignation?: string;
}

export class SettingsService {
  async getSettings() {
    let settings = await prisma.cardSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.cardSettings.create({
        data: {
          id: 1,
          logoUrl: "/logo.png",
          signatureUrl: "/placeholder-signature.png",
        },
      });
    }

    return settings;
  }

  async updateSettings(data: UpdateSettingsDTO) {
    return prisma.cardSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        logoUrl: data.logoUrl || "/logo.png",
        signatureUrl: data.signatureUrl || "/placeholder-signature.png",
        ...data,
      },
    });
  }
}

export const settingsService = new SettingsService();
