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

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    "Phone number must be in international format (e.g. +971501234567).",
  );

export const registerSchema = z.discriminatedUnion("role", [
  z
    .object({
      email: emailSchema,
      password: passwordSchema,
      phoneNumber: phoneSchema,
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
      phoneNumber: phoneSchema,
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

export const verifyOtpSchema = z
  .object({
    pendingToken: z.string().min(1, "Pending token is required."),
    code: z
      .string()
      .length(6, "Code must be exactly 6 digits.")
      .regex(/^\d{6}$/, "Code must be 6 digits."),
  })
  .strict();

export const resendOtpSchema = z
  .object({
    pendingToken: z.string().min(1, "Pending token is required."),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
