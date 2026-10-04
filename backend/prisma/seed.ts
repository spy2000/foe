import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  for (const bg of bloodGroups) {
    await prisma.bloodGroup.upsert({
      where: { bloodGroup: bg },
      update: {},
      create: { bloodGroup: bg },
    });
  }
  console.log(`✅ Seeded ${bloodGroups.length} blood groups`);

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
      validityClause:
        "Official use only by authorised members of the trust.",
      returnNote:
        "If found, please return this card to the Friends Of Education Charitable Trust at the above address or contact number",
      defaultEmergencyContact: "+91 9136643813",
      defaultAuthorisedName: "Mr. Shailesh Pandey",
      defaultAuthorisedDesignation: "Founder and President",
    },
  });
  console.log("✅ Seeded default CardSettings (ID: 1)");

  // Also add sample member from the reference image if not already present
  const existingSample = await prisma.member.findFirst({
    where: { memberId: "0001" },
  });

  if (!existingSample) {
    const bgBPositive = await prisma.bloodGroup.findFirst({
      where: { bloodGroup: "B+" },
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
        },
      });
      console.log("✅ Seeded initial sample member (0001: Mr. Shailesh Pandey)");
    }
  }

  console.log("🌿 Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
