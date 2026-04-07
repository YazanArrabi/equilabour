import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { UpdateWorkerProfileSchema } from "./worker-profile.schemas.js";
import * as workerProfileService from "./worker-profile.service.js";

export async function getMyWorkerProfile(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const profile = await workerProfileService.getWorkerProfileByUserId(
    req.auth.userId,
  );

  return sendSuccess(res, profile);
}

export async function getWorkerProfileById(req: Request, res: Response) {
  const profile = await workerProfileService.getWorkerProfileById(
    req.params.workerId,
  );

  return sendSuccess(res, profile);
}

export async function updateMyWorkerProfile(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = UpdateWorkerProfileSchema.parse(req.body);

  const profile = await workerProfileService.updateWorkerProfile(
    req.auth.userId,
    input,
  );

  return sendSuccess(res, profile);
}
