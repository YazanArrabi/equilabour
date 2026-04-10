import { z } from "zod";

const experienceLevelEnum = z.enum(["entry", "junior", "mid", "senior"]);
const employmentTypeEnum = z.enum([
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
]);

export const CreateJobSchema = z
  .object({
    title: z.string().min(1, "Title must not be empty."),
    description: z.string().min(1, "Description must not be empty."),
    requiredSkills: z.array(z.string()),
    experienceLevel: experienceLevelEnum,
    employmentType: employmentTypeEnum,
    salary: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    payMin: z.number().int().min(0).nullable().optional(),
    payMax: z.number().int().min(0).nullable().optional(),
  })
  .strip();

export const UpdateJobSchema = z
  .object({
    title: z.string().min(1, "Title must not be empty.").optional(),
    description: z.string().min(1, "Description must not be empty.").optional(),
    requiredSkills: z.array(z.string()).optional(),
    experienceLevel: experienceLevelEnum.optional(),
    employmentType: employmentTypeEnum.optional(),
    salary: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    payMin: z.number().int().min(0).nullable().optional(),
    payMax: z.number().int().min(0).nullable().optional(),
  })
  .strip()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const UpdateJobStatusSchema = z
  .object({
    status: z.enum(["active", "closed"]),
  })
  .strip();

// Accepts comma-separated values for multi-select filters, e.g. "full_time,contract"
export const JobQuerySchema = z
  .object({
    search: z.string().optional(),
    location: z.string().optional(),
    employmentType: z
      .string()
      .optional()
      .transform((v) =>
        v ? (v.split(",").filter(Boolean) as z.infer<typeof employmentTypeEnum>[]) : undefined,
      ),
    experienceLevel: z
      .string()
      .optional()
      .transform((v) =>
        v ? (v.split(",").filter(Boolean) as z.infer<typeof experienceLevelEnum>[]) : undefined,
      ),
    payMin: z.coerce.number().int().min(0).optional(),
    payMax: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strip();

export const MyJobsQuerySchema = z
  .object({
    status: z.enum(["active", "closed", "deleted"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strip();

export const LocationQuerySchema = z
  .object({
    q: z.string().optional(),
  })
  .strip();

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof UpdateJobStatusSchema>;
export type JobQueryInput = z.infer<typeof JobQuerySchema>;
export type MyJobsQueryInput = z.infer<typeof MyJobsQuerySchema>;
