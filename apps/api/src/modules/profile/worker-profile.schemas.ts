import { z } from "zod";

export const WorkerProfileQuerySchema = z
  .object({
    search: z.string().optional(),
    skills: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined)),
    experienceLevel: z
      .string()
      .optional()
      .transform((v) =>
        v
          ? (v.split(",").filter(Boolean) as Array<"entry" | "junior" | "mid" | "senior">)
          : undefined,
      ),
    location: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sortBy: z.enum(["updatedAt", "skillRating"]).default("updatedAt").optional(),
  })
  .strip();

export type WorkerProfileQueryInput = z.infer<typeof WorkerProfileQuerySchema>;

// phoneNumber and email are verified credentials — they cannot be changed
// through the profile edit endpoint. A dedicated verification flow is required.
export const UpdateWorkerProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name must not be empty.").optional(),
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
