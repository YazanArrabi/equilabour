import { z } from "zod";

const fileTypeEnum = z.enum([
  "cv",
  "certificate",
  "recommendation_letter",
  "profile_picture",
  "logo",
]);

export const RequestUploadUrlSchema = z
  .object({
    fileType: fileTypeEnum,
    mimeType: z.string().min(1),
    originalFilename: z.string().min(1),
    sizeBytes: z.number().int().positive().max(10485760),
  })
  .strip();

export const ConfirmUploadSchema = z
  .object({
    s3Key: z.string().min(1),
    fileType: fileTypeEnum,
    mimeType: z.string().min(1),
    originalFilename: z.string().min(1),
    sizeBytes: z.number().int().positive().max(10485760),
  })
  .strip();

export const FileQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strip();

export type RequestUploadUrlInput = z.infer<typeof RequestUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof ConfirmUploadSchema>;
export type FileQueryInput = z.infer<typeof FileQuerySchema>;
