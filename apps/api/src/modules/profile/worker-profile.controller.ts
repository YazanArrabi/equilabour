import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { UpdateWorkerProfileSchema, WorkerProfileQuerySchema } from "./worker-profile.schemas.js";
import { LocationQuerySchema } from "../jobs/job.schemas.js";
import * as workerProfileService from "./worker-profile.service.js";

export async function listWorkerProfiles(req: Request, res: Response) {
  const query = WorkerProfileQuerySchema.parse(req.query);
  const result = await workerProfileService.listWorkerProfiles(query);
  return sendSuccess(res, result);
}

export async function listWorkerLocations(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  const { q } = LocationQuerySchema.parse(req.query);
  const locations = await workerProfileService.listWorkerLocations(q);
  return sendSuccess(res, locations);
}

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

export async function getMyAiAnalysis(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const profile = await workerProfileService.getWorkerProfileByUserId(
    req.auth.userId,
  );
  const analysis = await workerProfileService.getWorkerAiAnalysis(profile.id);

  return sendSuccess(res, { analysis });
}

export async function getWorkerProfileAiAnalysis(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const profile = await workerProfileService.getWorkerProfileById(
    req.params.workerId,
  );
  const analysis = await workerProfileService.getWorkerAiAnalysis(profile.id);

  return sendSuccess(res, { analysis });
}
