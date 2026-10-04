import { z } from "zod";

const phoneRegex = /^\+?[0-9]{10,15}$/;

export const createMemberSchema = z
  .object({
    registrationNo: z.string().min(1, "Registration number is required").default("Reg. E-0040751(GBR)"),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    designation: z
      .string()
      .min(2, "Designation must be at least 2 characters")
      .max(100, "Designation cannot exceed 100 characters"),
    bloodGroupId: z.coerce.number().int().positive("Valid blood group ID is required"),
    contactNumber: z
      .string()
      .regex(phoneRegex, "Contact number must be 10-15 digits with optional + prefix"),
    emailId: z.string().email("Invalid email address"),
    dateOfJoining: z.string().min(1, "Date of joining is required"),
    emergencyContactName: z
      .string()
      .min(2, "Emergency contact name must be at least 2 characters"),
    emergencyContactRelationship: z.enum(
      ["Father", "Mother", "Spouse", "Sibling", "Friend", "Trust Office", "Other"],
      {
        errorMap: () => ({
          message: "Relationship must be Father, Mother, Spouse, Sibling, Friend, or Other",
        }),
      }
    ),
    emergencyContactNumber: z
      .string()
      .regex(phoneRegex, "Emergency contact number must be 10-15 digits with optional + prefix"),
    photoPath: z.string().min(1, "Photograph URL is required"),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    memberStatus: z.enum(["Active", "Inactive"]).default("Active"),
    authorisedName: z.string().min(1, "Authorised person name is required"),
    authorisedDesignation: z.string().min(1, "Authorised designation is required"),
    remarks: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      const issue = new Date(data.issueDate).getTime();
      const expiry = new Date(data.expiryDate).getTime();
      if (isNaN(issue) || isNaN(expiry)) return true;
      return expiry >= issue;
    },
    {
      message: "Expiry date must be greater than or equal to issue date",
      path: ["expiryDate"],
    }
  );

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z
  .object({
    registrationNo: z.string().min(1, "Registration number is required").optional(),
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .optional(),
    designation: z
      .string()
      .min(2, "Designation must be at least 2 characters")
      .max(100, "Designation cannot exceed 100 characters")
      .optional(),
    bloodGroupId: z.coerce.number().int().positive("Valid blood group ID is required").optional(),
    contactNumber: z
      .string()
      .regex(phoneRegex, "Contact number must be 10-15 digits with optional + prefix")
      .optional(),
    emailId: z.string().email("Invalid email address").optional(),
    dateOfJoining: z.string().min(1, "Date of joining is required").optional(),
    emergencyContactName: z
      .string()
      .min(2, "Emergency contact name must be at least 2 characters")
      .optional(),
    emergencyContactRelationship: z
      .enum(["Father", "Mother", "Spouse", "Sibling", "Friend", "Trust Office", "Other"], {
        errorMap: () => ({
          message: "Relationship must be Father, Mother, Spouse, Sibling, Friend, or Other",
        }),
      })
      .optional(),
    emergencyContactNumber: z
      .string()
      .regex(phoneRegex, "Emergency contact number must be 10-15 digits with optional + prefix")
      .optional(),
    photoPath: z.string().min(1, "Photograph URL is required").optional(),
    issueDate: z.string().min(1, "Issue date is required").optional(),
    expiryDate: z.string().min(1, "Expiry date is required").optional(),
    memberStatus: z.enum(["Active", "Inactive"]).optional(),
    authorisedName: z.string().min(1, "Authorised person name is required").optional(),
    authorisedDesignation: z.string().min(1, "Authorised designation is required").optional(),
    remarks: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.issueDate || !data.expiryDate) return true;
      const issue = new Date(data.issueDate).getTime();
      const expiry = new Date(data.expiryDate).getTime();
      if (isNaN(issue) || isNaN(expiry)) return true;
      return expiry >= issue;
    },
    {
      message: "Expiry date must be greater than or equal to issue date",
      path: ["expiryDate"],
    }
  );

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
