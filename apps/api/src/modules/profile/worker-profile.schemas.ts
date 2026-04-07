import { z } from "zod";

export const UpdateWorkerProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name must not be empty.").optional(),
    phoneNumber: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    skills: z.array(z.string()).optional(),
    yearsOfExperience: z
      .number()
      .int("Years of experience must be an integer.")
      .min(0, "Years of experience must be 0 or greater.")
      .optional(),
    workExperienceSummary: z.string().nullable().optional(),
    pastJobTitles: z.array(z.string()).optional(),
    employmentHistory: z.string().nullable().optional(),
  })
  .strip()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export type UpdateWorkerProfileInput = z.infer<typeof UpdateWorkerProfileSchema>;
