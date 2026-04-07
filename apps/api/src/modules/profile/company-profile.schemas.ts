import { z } from "zod";

export const UpdateCompanyProfileSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, "Company name must not be empty.")
      .optional(),
    location: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    contactInfo: z.string().nullable().optional(),
    overview: z.string().nullable().optional(),
  })
  .strip()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type UpdateCompanyProfileInput = z.infer<
  typeof UpdateCompanyProfileSchema
>;
