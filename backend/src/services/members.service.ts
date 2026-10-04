import { prisma } from "../config/db";
import { z } from "zod";

export const createMemberSchema = z.object({
  registrationNo: z.string().min(1, "Registration number is required"),
  fullName: z.string().min(1, "Full name is required").max(100),
  designation: z.string().min(1, "Designation is required").max(100),
  bloodGroupId: z.coerce.number().int().positive("Blood group is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits").max(15),
  emailId: z.string().email("Invalid email address"),
  dateOfJoining: z.string().or(z.date()),
  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactRelationship: z.string().min(1, "Relationship is required"),
  emergencyContactNumber: z.string().min(10, "Emergency contact number must be at least 10 digits").max(15),
  photoPath: z.string().min(1, "Photo is required"),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  memberStatus: z.enum(["Active", "Inactive"]).default("Active"),
  authorisedName: z.string().min(1, "Authorised name is required"),
  authorisedDesignation: z.string().min(1, "Authorised designation is required"),
  remarks: z.string().optional().nullable(),
});

export type CreateMemberDTO = z.infer<typeof createMemberSchema>;

export class MembersService {
  async getNextMemberId(): Promise<string> {
    const lastMember = await prisma.member.findFirst({
      orderBy: { id: "desc" },
      select: { memberId: true },
    });

    let nextNum = 1;
    if (lastMember?.memberId) {
      // Strip any non-digit prefix if exists, parse integer
      const numericPart = lastMember.memberId.replace(/\D/g, "");
      const parsed = parseInt(numericPart, 10);
      if (!isNaN(parsed)) {
        nextNum = parsed + 1;
      }
    }

    return String(nextNum).padStart(4, "0"); // e.g. "0001", "0002" or "001" - let's pad to 4 digits or match reference (0001 / 001)
  }

  async getMembers(params: {
    cursor?: string;
    limit?: number;
    status?: "active" | "deleted" | "all";
    includeDeleted?: boolean;
  }) {
    const limit = Math.min(params.limit || 10, 50);
    const where: Record<string, unknown> = {};

    if (params.includeDeleted) {
      // return all
    } else if (params.status === "deleted") {
      where.deletedAt = { not: null };
    } else if (params.status === "all") {
      // no filter
    } else {
      // default: active
      where.deletedAt = null;
    }

    const queryOptions: Record<string, unknown> = {
      where,
      take: limit + 1,
      orderBy: { id: "desc" },
      include: { bloodGroup: true },
    };

    if (params.cursor) {
      queryOptions.cursor = { id: BigInt(params.cursor) };
      queryOptions.skip = 1;
    }

    const items = await prisma.member.findMany(
      queryOptions as Parameters<typeof prisma.member.findMany>[0]
    );

    let nextCursor: string | null = null;
    const hasMore = items.length > limit;
    if (hasMore) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id.toString() : null;
    }

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async getMemberById(id: bigint | string) {
    const memberIdBigInt = typeof id === "string" ? BigInt(id) : id;
    const member = await prisma.member.findUnique({
      where: { id: memberIdBigInt },
      include: { bloodGroup: true },
    });

    if (!member) {
      return null;
    }

    const settings = await prisma.cardSettings.findUnique({
      where: { id: 1 },
    });

    return { member, settings };
  }

  async createMember(data: CreateMemberDTO) {
    const memberId = await this.getNextMemberId();

    return prisma.member.create({
      data: {
        memberId,
        registrationNo: data.registrationNo,
        fullName: data.fullName,
        designation: data.designation,
        bloodGroupId: data.bloodGroupId,
        contactNumber: data.contactNumber,
        emailId: data.emailId,
        dateOfJoining: new Date(data.dateOfJoining),
        emergencyContactName: data.emergencyContactName,
        emergencyContactRelationship: data.emergencyContactRelationship,
        emergencyContactNumber: data.emergencyContactNumber,
        photoPath: data.photoPath,
        issueDate: new Date(data.issueDate),
        expiryDate: new Date(data.expiryDate),
        memberStatus: data.memberStatus,
        authorisedName: data.authorisedName,
        authorisedDesignation: data.authorisedDesignation,
        remarks: data.remarks || null,
      },
      include: { bloodGroup: true },
    });
  }

  async softDeleteMember(id: bigint | string) {
    const memberIdBigInt = typeof id === "string" ? BigInt(id) : id;
    return prisma.member.update({
      where: { id: memberIdBigInt },
      data: {
        deletedAt: new Date(),
        deletedBy: "admin",
      },
    });
  }

  async restoreMember(id: bigint | string) {
    const memberIdBigInt = typeof id === "string" ? BigInt(id) : id;
    return prisma.member.update({
      where: { id: memberIdBigInt },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });
  }
}

export const membersService = new MembersService();
