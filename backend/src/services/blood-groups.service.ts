import { prisma } from "../config/db";

export class BloodGroupsService {
  async getActiveBloodGroups() {
    return prisma.bloodGroup.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: { id: "asc" },
    });
  }
}

export const bloodGroupsService = new BloodGroupsService();
