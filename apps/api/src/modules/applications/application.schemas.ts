import { z } from "zod";

export const CreateApplicationSchema = z
  .object({
    message: z.string().optional(),
  })
  .strip();

export const UpdateApplicationStatusSchema = z
  .object({
    status: z.enum(["accepted", "rejected"]),
  })
  .strip();

export const ApplicationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strip();

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;
export type ApplicationQueryInput = z.infer<typeof ApplicationQuerySchema>;
