-- CreateTable
CREATE TABLE "blood_groups" (
    "id" SERIAL NOT NULL,
    "blood_group" VARCHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(50),

    CONSTRAINT "blood_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" BIGSERIAL NOT NULL,
    "member_id" VARCHAR(20) NOT NULL,
    "registration_no" VARCHAR(50) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "blood_group_id" INTEGER NOT NULL,
    "contact_number" VARCHAR(15) NOT NULL,
    "email_id" VARCHAR(100) NOT NULL,
    "date_of_joining" DATE NOT NULL,
    "emergency_contact_name" VARCHAR(100) NOT NULL,
    "emergency_contact_relationship" VARCHAR(50) NOT NULL,
    "emergency_contact_number" VARCHAR(15) NOT NULL,
    "photo_path" VARCHAR(255) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "member_status" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "authorised_name" VARCHAR(100) NOT NULL,
    "authorised_designation" VARCHAR(100) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "deleted_at" TIMESTAMP(3),
    "deleted_by" VARCHAR(50),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "trust_name" TEXT NOT NULL DEFAULT 'FRIENDS OF EDUCATION',
    "trust_subtitle" TEXT NOT NULL DEFAULT 'CHARITABLE TRUST',
    "registration_no" TEXT NOT NULL DEFAULT 'Reg. E-0040751(GBR)',
    "logo_url" TEXT NOT NULL DEFAULT '',
    "signature_url" TEXT NOT NULL DEFAULT '',
    "website_url" TEXT NOT NULL DEFAULT 'www.friendsofeducation.in',
    "about_us_text" TEXT NOT NULL DEFAULT 'Friends Of Education Charitable Trust is committed to supporting education and empowering lives for a better tomorrow.',
    "validity_clause" TEXT NOT NULL DEFAULT 'Official use only by authorised members of the trust.',
    "return_note" TEXT NOT NULL DEFAULT 'If found, please return this card to the Friends Of Education Charitable Trust at the above address or contact number',
    "default_emergency_contact" TEXT NOT NULL DEFAULT '+91 9136643813',
    "default_authorised_name" TEXT NOT NULL DEFAULT 'Mr. Shailesh Pandey',
    "default_authorised_designation" TEXT NOT NULL DEFAULT 'Founder and President',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blood_groups_blood_group_key" ON "blood_groups"("blood_group");

-- CreateIndex
CREATE UNIQUE INDEX "members_member_id_key" ON "members"("member_id");

-- CreateIndex
CREATE INDEX "members_deleted_at_id_idx" ON "members"("deleted_at", "id" DESC);

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_blood_group_id_fkey" FOREIGN KEY ("blood_group_id") REFERENCES "blood_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
