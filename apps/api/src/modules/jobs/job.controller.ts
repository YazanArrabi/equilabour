import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import {
  CreateJobSchema,
  JobQuerySchema,
  LocationQuerySchema,
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
  const result = await jobService.listActiveJobs(query, req.auth.userId);

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

  const { jobId } = req.params as { jobId: string };
  const job = await jobService.getJobById(jobId, req.auth.userId);

  return sendSuccess(res, job);
}

export async function updateJob(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { jobId } = req.params as { jobId: string };
  const input = UpdateJobSchema.parse(req.body);
  const job = await jobService.updateJob(req.auth.userId, jobId, input);

  return sendSuccess(res, job);
}

export async function updateJobStatus(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { jobId } = req.params as { jobId: string };
  const input = UpdateJobStatusSchema.parse(req.body);
  const job = await jobService.updateJobStatus(
    req.auth.userId,
    jobId,
    input.status,
  );

  return sendSuccess(res, job);
}

export async function listJobLocations(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  const { q } = LocationQuerySchema.parse(req.query);
  const locations = await jobService.listJobLocations(q);
  return sendSuccess(res, locations);
}

export async function softDeleteJob(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const { jobId } = req.params as { jobId: string };
  const job = await jobService.softDeleteJob(req.auth.userId, jobId);

  return sendSuccess(res, job);
}
