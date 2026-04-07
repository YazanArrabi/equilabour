import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import {
  CreateJobSchema,
  JobQuerySchema,
  MyJobsQuerySchema,
  UpdateJobSchema,
  UpdateJobStatusSchema,
} from "./job.schemas.js";
import * as jobService from "./job.service.js";

export async function createJob(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = CreateJobSchema.parse(req.body);
  const job = await jobService.createJob(req.auth.userId, input);

  return sendSuccess(res, job, 201);
}

export async function listActiveJobs(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const query = JobQuerySchema.parse(req.query);
  const result = await jobService.listActiveJobs(query);

  return sendSuccess(res, result);
}

export async function listMyJobs(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const query = MyJobsQuerySchema.parse(req.query);
  const result = await jobService.listMyJobs(req.auth.userId, query);

  return sendSuccess(res, result);
}

export async function getJobById(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const job = await jobService.getJobById(req.params.jobId, req.auth.userId);

  return sendSuccess(res, job);
}

export async function updateJob(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = UpdateJobSchema.parse(req.body);
  const job = await jobService.updateJob(req.auth.userId, req.params.jobId, input);

  return sendSuccess(res, job);
}

export async function updateJobStatus(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = UpdateJobStatusSchema.parse(req.body);
  const job = await jobService.updateJobStatus(
    req.auth.userId,
    req.params.jobId,
    input.status,
  );

  return sendSuccess(res, job);
}

export async function softDeleteJob(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const job = await jobService.softDeleteJob(req.auth.userId, req.params.jobId);

  return sendSuccess(res, job);
}
