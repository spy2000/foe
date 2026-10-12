import dotenv from "dotenv";
dotenv.config({ override: true });

import { PrismaClient, Role, UserStatus, ViewScope } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface SeedOptions {
  target: string;
}

function parseCliArgs(): SeedOptions {
  const args = process.argv.slice(2);
  let target = "all";

  for (const arg of args) {
    if (arg.startsWith("--target=")) {
      target = arg.split("=")[1].toLowerCase().trim();
    } else if (arg === "--target" || arg === "-t") {
      const idx = args.indexOf(arg);
      if (idx !== -1 && args[idx + 1]) {
        target = args[idx + 1].toLowerCase().trim();
      }
    }
  }

  return { target };
}

export async function seedUsers(): Promise<void> {
  console.log("👤 Checking Superadmin singleton...");

  const superadminEmail =
    process.env.SUPERADMIN_EMAIL || "superadmin@friendsofeducation.in";
  const superadminName = process.env.SUPERADMIN_NAME || "Super Admin";
  const defaultPassword =
    process.env.SUPERADMIN_DEFAULT_PASSWORD || "SuperPassword@123";

  // Check if a user with Role.SUPERADMIN exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: Role.SUPERADMIN },
  });

  if (existingSuperAdmin) {
    console.log(
      `ℹ️  Superadmin already exists: ${existingSuperAdmin.email} (${existingSuperAdmin.id}). Skipping creation.`
    );
    // Optionally update name/email if necessary, without overwriting password
    if (
      existingSuperAdmin.email !== superadminEmail ||
      existingSuperAdmin.name !== superadminName
    ) {
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          email: superadminEmail,
          name: superadminName,
        },
      });
      console.log(`🔄 Updated Superadmin contact details to: ${superadminEmail}`);
    }
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const superAdmin = await prisma.user.create({
    data: {
      email: superadminEmail,
      name: superadminName,
      passwordHash,
      role: Role.SUPERADMIN,
      status: UserStatus.ACTIVE,
      forcePasswordChange: false,
      canAddMember: true,
      canDownloadCard: true,
      viewScope: ViewScope.ALL,
    },
  });

  console.log(
    `✅ Successfully seeded Superadmin: ${superAdmin.email} (ID: ${superAdmin.id})`
  );
}

export async function seedBloodGroups(): Promise<void> {
  console.log("🩸 Seeding blood groups...");
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  for (const bg of bloodGroups) {
    await prisma.bloodGroup.upsert({
      where: { bloodGroup: bg },
      update: {},
      create: { bloodGroup: bg },
    });
  }
  console.log(`✅ Seeded ${bloodGroups.length} blood groups`);
}

export async function seedCardSettings(): Promise<void> {
  console.log("🎴 Seeding card settings...");
  await prisma.cardSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      trustName: "FRIENDS OF EDUCATION",
      trustSubtitle: "CHARITABLE TRUST",
      registrationNo: "Reg. E-0040751(GBR)",
      logoUrl: "/logo.png",
      signatureUrl: "/placeholder-signature.png",
      websiteUrl: "www.friendsofeducation.in",
      aboutUsText:
        "Friends Of Education Charitable Trust is committed to supporting education and empowering lives for a better tomorrow.",
      validityClause: "Official use only by authorised members of the trust.",
      returnNote:
        "If found, please return this card to the Friends Of Education Charitable Trust at the above address or contact number",
      defaultEmergencyContact: "+91 9136643813",
      defaultAuthorisedName: "Mr. Shailesh Pandey",
      defaultAuthorisedDesignation: "Founder and President",
    },
  });
  console.log("✅ Seeded default CardSettings (ID: 1)");
}

export async function seedMembers(): Promise<void> {
  console.log("👥 Checking sample member...");
  const existingSample = await prisma.member.findFirst({
    where: { memberId: "0001" },
  });

  if (!existingSample) {
    const bgBPositive = await prisma.bloodGroup.findFirst({
      where: { bloodGroup: "B+" },
    });

    // Find superadmin user for createdById audit relation if available
    const superAdmin = await prisma.user.findFirst({
      where: { role: Role.SUPERADMIN },
    });

    if (bgBPositive) {
      await prisma.member.create({
        data: {
          memberId: "0001",
          registrationNo: "Reg. E-0040751(GBR)",
          fullName: "Mr. Shailesh Pandey",
          designation: "Founder and President",
          bloodGroupId: bgBPositive.id,
          contactNumber: "+91 9820556711",
          emailId: "contact@friendsofeducation.in",
          dateOfJoining: new Date("2020-01-15"),
          emergencyContactName: "Emergency Desk",
          emergencyContactRelationship: "Trust Office",
          emergencyContactNumber: "+91 9136643813",
          photoPath: "/sample-member.jpg",
          issueDate: new Date("2024-01-01"),
          expiryDate: new Date("2029-12-31"),
          memberStatus: "Active",
          authorisedName: "Mr. Shailesh Pandey",
          authorisedDesignation: "Founder and President",
          remarks: "Founder member of Friends of Education Charitable Trust",
          createdById: superAdmin ? superAdmin.id : null,
        },
      });
      console.log("✅ Seeded initial sample member (0001: Mr. Shailesh Pandey)");
    }
  } else {
    console.log("ℹ️  Sample member 0001 already exists.");
  }
}

async function main() {
  const { target } = parseCliArgs();
  console.log(`🌱 Starting seed process (target: ${target})...`);

  switch (target) {
    case "users":
    case "user":
      await seedUsers();
      break;
    case "bloodgroups":
    case "blood-groups":
      await seedBloodGroups();
      break;
    case "settings":
    case "cardsettings":
      await seedCardSettings();
      break;
    case "members":
    case "member":
      await seedMembers();
      break;
    case "all":
    default:
      await seedBloodGroups();
      await seedCardSettings();
      await seedUsers();
      await seedMembers();
      break;
  }

  console.log("🌿 Seeding finished successfully.");
}

main()
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.error("❌ Seed error:", e.message);
      if (e.stack) {
        console.error(e.stack);
      }
    } else {
      console.error("❌ Seed error: An unknown error occurred", e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
