import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import {
  ApplicationQuerySchema,
  CreateApplicationSchema,
  UpdateApplicationStatusSchema,
} from "./application.schemas.js";
import * as applicationService from "./application.service.js";

export async function applyToJob(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = CreateApplicationSchema.parse(req.body);
  const application = await applicationService.createApplication(
    req.auth.userId,
    req.params.jobId,
    input,
  );

  return sendSuccess(res, application, 201);
}

export async function listJobApplications(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const query = ApplicationQuerySchema.parse(req.query);
  const result = await applicationService.listJobApplications(
    req.auth.userId,
    req.params.jobId,
    query,
  );

  return sendSuccess(res, result);
}

export async function getMyApplications(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const query = ApplicationQuerySchema.parse(req.query);
  const result = await applicationService.getMyApplications(
    req.auth.userId,
    query,
  );

  return sendSuccess(res, result);
}

export async function getApplicationById(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const application = await applicationService.getApplicationById(
    req.auth.userId,
    req.params.applicationId,
  );

  return sendSuccess(res, application);
}

export async function updateApplicationStatus(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = UpdateApplicationStatusSchema.parse(req.body);
  const application = await applicationService.updateApplicationStatus(
    req.auth.userId,
    req.params.applicationId,
    input.status,
  );

  return sendSuccess(res, application);
}
