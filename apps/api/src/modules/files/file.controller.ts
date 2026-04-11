import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import {
  ConfirmUploadSchema,
  FileQuerySchema,
  RequestUploadUrlSchema,
} from "./file.schemas.js";
import * as fileService from "./file.service.js";

export async function requestUploadUrl(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = RequestUploadUrlSchema.parse(req.body);
  const result = await fileService.requestUploadUrl(
    req.auth.userId,
    req.auth.role,
    input,
  );

  return sendSuccess(res, result);
}

export async function confirmUpload(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = ConfirmUploadSchema.parse(req.body);
  const file = await fileService.confirmUpload(
    req.auth.userId,
    req.auth.role,
    input,
  );

  return sendSuccess(res, file, 201);
}

export async function getMyFiles(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const query = FileQuerySchema.parse(req.query);
  const result = await fileService.getMyFiles(
    req.auth.userId,
    req.auth.role,
    query,
  );

  return sendSuccess(res, result);
}

export async function getFileDownloadUrl(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { fileId } = req.params as { fileId: string };
  const result = await fileService.getFileDownloadUrl(req.auth.userId, fileId);

  return sendSuccess(res, result);
}

export async function deleteFile(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { fileId } = req.params as { fileId: string };
  const result = await fileService.deleteFile(req.auth.userId, fileId);

  return sendSuccess(res, result);
}
