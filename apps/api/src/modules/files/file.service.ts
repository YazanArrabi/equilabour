import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

import {
  FileAssetType,
  FileOwnerType,
  Prisma,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { s3Client, S3_BUCKET_NAME } from "../../lib/s3.js";
import { analyzeWorkerProfile } from "../ai/ai.service.js";
import { AppError } from "../../utils/app-error.js";
import type {
  ConfirmUploadInput,
  FileQueryInput,
  RequestUploadUrlInput,
} from "./file.schemas.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const WORKER_FILE_TYPES = new Set<string>([
  "cv",
  "certificate",
  "recommendation_letter",
  "profile_picture",
]);

const COMPANY_FILE_TYPES = new Set<string>(["logo"]);

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  cv: ["application/pdf"],
  certificate: ["application/pdf", "image/jpeg", "image/png"],
  recommendation_letter: ["application/pdf"],
  profile_picture: ["image/jpeg", "image/png", "image/webp"],
  logo: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
};

const DISPLAY_ASSET_TYPES = new Set<string>(["profile_picture", "logo"]);

// ─── Select ───────────────────────────────────────────────────────────────────
// s3Key is intentionally excluded from all responses.

const fileAssetSelect = {
  id: true,
  ownerType: true,
  workerProfileId: true,
  companyProfileId: true,
  type: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  isCompanyIssued: true,
  uploadedAt: true,
  updatedAt: true,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileAsset = Prisma.FileAssetGetPayload<{
  select: typeof fileAssetSelect;
}>;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Private helpers ──────────────────────────────────────────────────────────

function validateRoleForFileType(userRole: string, fileType: string): void {
  if (userRole === "worker" && !WORKER_FILE_TYPES.has(fileType)) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to upload this file type.",
    );
  }
  if (userRole === "company" && !COMPANY_FILE_TYPES.has(fileType)) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to upload this file type.",
    );
  }
}

function validateMimeType(fileType: string, mimeType: string): void {
  const allowed = ALLOWED_MIME_TYPES[fileType];
  if (!allowed || !allowed.includes(mimeType)) {
    throw new AppError(
      400,
      "INVALID_MIME_TYPE",
      "MIME type not allowed for this file type.",
    );
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function requestUploadUrl(
  _userId: string,
  userRole: string,
  input: RequestUploadUrlInput,
): Promise<{ presignedUrl: string; s3Key: string; expiresIn: number }> {
  validateRoleForFileType(userRole, input.fileType);
  validateMimeType(input.fileType, input.mimeType);

  const s3Key = `uploads/${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    ContentType: input.mimeType,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900,
  });

  return { presignedUrl, s3Key, expiresIn: 900 };
}

export async function confirmUpload(
  userId: string,
  userRole: string,
  input: ConfirmUploadInput,
): Promise<FileAsset> {
  validateRoleForFileType(userRole, input.fileType);
  validateMimeType(input.fileType, input.mimeType);

  let profileId: string;

  if (userRole === "worker") {
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!workerProfile) {
      throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
    }
    profileId = workerProfile.id;
  } else {
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!companyProfile) {
      throw new AppError(
        404,
        "PROFILE_NOT_FOUND",
        "Company profile not found.",
      );
    }
    profileId = companyProfile.id;
  }

  let createdFile: FileAsset;
  try {
    createdFile = await prisma.$transaction(async (tx) => {
      const file = await tx.fileAsset.create({
        data: {
          ownerType:
            userRole === "worker" ? FileOwnerType.worker : FileOwnerType.company,
          workerProfileId: userRole === "worker" ? profileId : null,
          companyProfileId: userRole === "company" ? profileId : null,
          type: input.fileType as FileAssetType,
          originalFilename: input.originalFilename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          s3Key: input.s3Key,
          isCompanyIssued: false,
        },
        select: fileAssetSelect,
      });

      if (input.fileType === "profile_picture") {
        await tx.workerProfile.update({
          where: { id: profileId },
          data: { profilePictureFileId: file.id },
        });
      }

      if (input.fileType === "logo") {
        await tx.companyProfile.update({
          where: { id: profileId },
          data: { logoFileId: file.id },
        });
      }

      return file;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "DUPLICATE_FILE_KEY",
        "A file with this key already exists.",
      );
    }
    throw error;
  }

  // Trigger AI analysis for worker file uploads (outside transaction, after DB write succeeds)
  if (userRole === "worker") {
    await analyzeWorkerProfile(profileId);
  }

  return createdFile;
}

export async function getMyFiles(
  userId: string,
  userRole: string,
  query: FileQueryInput,
): Promise<PaginatedResult<FileAsset>> {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  let where: Prisma.FileAssetWhereInput;

  if (userRole === "worker") {
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!workerProfile) {
      throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
    }
    where = { workerProfileId: workerProfile.id };
  } else {
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!companyProfile) {
      throw new AppError(
        404,
        "PROFILE_NOT_FOUND",
        "Company profile not found.",
      );
    }
    where = { companyProfileId: companyProfile.id };
  }

  const [total, items] = await prisma.$transaction([
    prisma.fileAsset.count({ where }),
    prisma.fileAsset.findMany({
      where,
      select: fileAssetSelect,
      skip,
      take: limit,
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFileDownloadUrl(
  userId: string,
  fileId: string,
): Promise<{ downloadUrl: string; expiresIn: number }> {
  const file = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    include: {
      workerProfile: { select: { userId: true } },
      companyProfile: { select: { userId: true } },
    },
  });

  if (!file) {
    throw new AppError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const ownerUserId =
    file.ownerType === "worker"
      ? file.workerProfile?.userId
      : file.companyProfile?.userId;

  if (!DISPLAY_ASSET_TYPES.has(file.type)) {
    if (ownerUserId !== userId) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "You are not allowed to access this resource.",
      );
    }
  }

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: file.s3Key,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  return { downloadUrl, expiresIn: 900 };
}

export async function deleteFile(
  userId: string,
  fileId: string,
): Promise<{ deleted: boolean; id: string }> {
  const file = await prisma.fileAsset.findUnique({
    where: { id: fileId },
    include: {
      workerProfile: {
        select: { userId: true, id: true, profilePictureFileId: true },
      },
      companyProfile: {
        select: { userId: true, id: true, logoFileId: true },
      },
    },
  });

  if (!file) {
    throw new AppError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const ownerUserId =
    file.ownerType === "worker"
      ? file.workerProfile?.userId
      : file.companyProfile?.userId;

  if (ownerUserId !== userId) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  // Capture s3Key before DB deletion — it will be gone after the transaction.
  const s3Key = file.s3Key;

  await prisma.$transaction(async (tx) => {
    if (
      file.type === "profile_picture" &&
      file.workerProfile?.profilePictureFileId === file.id
    ) {
      await tx.workerProfile.update({
        where: { id: file.workerProfile.id },
        data: { profilePictureFileId: null },
      });
    }

    if (
      file.type === "logo" &&
      file.companyProfile?.logoFileId === file.id
    ) {
      await tx.companyProfile.update({
        where: { id: file.companyProfile.id },
        data: { logoFileId: null },
      });
    }

    await tx.fileAsset.delete({ where: { id: fileId } });
  });

  // S3 deletion happens after DB deletion succeeds.
  // If this fails, the S3 object becomes an orphan — acceptable for v1.
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: s3Key }),
  );

  return { deleted: true, id: fileId };
}
