import { z } from "zod";

const phoneRegex = /^\+?[0-9]{10,15}$/;

export const memberBaseSchema = z
  .object({
    registrationNo: z.string().min(1, "Registration number is required"),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    designation: z
      .string()
      .min(2, "Designation must be at least 2 characters")
      .max(100, "Designation cannot exceed 100 characters"),
    bloodGroupId: z.string().min(1, "Select a valid blood group"),
    dateOfJoining: z.string().min(1, "Date of joining is required"),
    contactNumber: z
      .string()
      .regex(phoneRegex, "Contact number must be 10-15 digits"),
    emailId: z.string().email("Valid email address is required"),
    emergencyContactName: z
      .string()
      .min(2, "Emergency contact name is required"),
    emergencyContactRelationship: z.string().min(1, "Relationship is required"),
    emergencyContactNumber: z
      .string()
      .regex(/^\+91\d{10}$/, "Must be +91 followed by exactly 10 digits"),
    photoPath: z.string().min(1, "Photograph upload is required"),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    memberStatus: z.enum(["Active", "Inactive"]),
    authorisedName: z.string().min(1, "Authorised name is required"),
    authorisedDesignation: z.string().min(1, "Authorised designation is required"),
    remarks: z.string().optional().nullable(),
  });

export function getMemberFormSchema(isEdit: boolean = false) {
  return memberBaseSchema
    .refine(
      (data) => {
        if (isEdit) return true;
        const date = new Date(data.issueDate);
        if (isNaN(date.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      {
        message: "Issue date must be today or in the future",
        path: ["issueDate"],
      }
    )
    .refine(
      (data) => {
        const issue = new Date(data.issueDate).getTime();
        const expiry = new Date(data.expiryDate).getTime();
        if (isNaN(issue) || isNaN(expiry)) return true;
        return expiry > issue;
      },
      {
        message: "Expiry date must be after issue date",
        path: ["expiryDate"],
      }
    );
}

export const memberFormSchema = getMemberFormSchema(false);

export type MemberFormValues = z.infer<typeof memberFormSchema>;

export const settingsFormSchema = z.object({
  trustName: z.string().min(1, "Trust name is required"),
  trustSubtitle: z.string().min(1, "Trust subtitle is required"),
  registrationNo: z.string().min(1, "Registration number is required"),
  logoUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  oldLogoUrl: z.string().optional(),
  oldSignatureUrl: z.string().optional(),
  websiteUrl: z.string().min(1, "Website URL is required"),
  aboutUsText: z.string().min(1, "About us text is required"),
  validityClause: z.string().min(1, "Validity clause is required"),
  returnNote: z.string().min(1, "Return note is required"),
  defaultEmergencyContact: z.string().min(1, "Default emergency contact is required"),
  defaultAuthorisedName: z.string().min(1, "Default authorised name is required"),
  defaultAuthorisedDesignation: z.string().min(1, "Default authorised designation is required"),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
