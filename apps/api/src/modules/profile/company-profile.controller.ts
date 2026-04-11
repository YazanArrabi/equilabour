import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { UpdateCompanyProfileSchema } from "./company-profile.schemas.js";
import * as companyProfileService from "./company-profile.service.js";

export async function getMyCompanyProfile(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const profile = await companyProfileService.getCompanyProfileByUserId(
    req.auth.userId,
  );

  return sendSuccess(res, profile);
}

export async function getCompanyProfileById(req: Request, res: Response) {
  const { companyId } = req.params as { companyId: string };
  const profile = await companyProfileService.getCompanyProfileById(companyId);

  return sendSuccess(res, profile);
}

export async function updateMyCompanyProfile(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  const input = UpdateCompanyProfileSchema.parse(req.body);

  const profile = await companyProfileService.updateCompanyProfile(
    req.auth.userId,
    input,
  );

  return sendSuccess(res, profile);
}
