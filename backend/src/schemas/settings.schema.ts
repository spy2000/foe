import { z } from "zod";

export const updateSettingsSchema = z.object({
  trustName: z.string().min(1, "Trust name cannot be empty").optional(),
  trustSubtitle: z.string().min(1, "Trust subtitle cannot be empty").optional(),
  registrationNo: z.string().min(1, "Registration number cannot be empty").optional(),
  logoUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  oldLogoUrl: z.string().optional(),
  oldSignatureUrl: z.string().optional(),
  websiteUrl: z.string().min(1, "Website URL cannot be empty").optional(),
  aboutUsText: z.string().min(1, "About us text cannot be empty").optional(),
  validityClause: z.string().min(1, "Validity clause cannot be empty").optional(),
  returnNote: z.string().min(1, "Return note cannot be empty").optional(),
  defaultEmergencyContact: z.string().min(1, "Default emergency contact cannot be empty").optional(),
  defaultAuthorisedName: z.string().min(1, "Default authorised name cannot be empty").optional(),
  defaultAuthorisedDesignation: z.string().min(1, "Default authorised designation cannot be empty").optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
