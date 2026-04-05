import { z } from "zod";

import { UserRole } from "../../../generated/prisma/client.js";

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(72, "Password must be at most 72 characters long.");

export const registerSchema = z.discriminatedUnion("role", [
  z
    .object({
      email: emailSchema,
      password: passwordSchema,
      role: z.literal(UserRole.worker),
      fullName: z
        .string()
        .trim()
        .min(1, "Full name is required.")
        .max(120, "Full name must be at most 120 characters long."),
    })
    .strict(),
  z
    .object({
      email: emailSchema,
      password: passwordSchema,
      role: z.literal(UserRole.company),
      companyName: z
        .string()
        .trim()
        .min(1, "Company name is required.")
        .max(160, "Company name must be at most 160 characters long."),
    })
    .strict(),
]);

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Password is required.")
      .max(72, "Password must be at most 72 characters long."),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
