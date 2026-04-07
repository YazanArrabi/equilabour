import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { UpdateCompanyProfileInput } from "./company-profile.schemas.js";

const companyProfileSelect = {
  id: true,
  userId: true,
  companyName: true,
  location: true,
  industry: true,
  contactInfo: true,
  overview: true,
  logoFileId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getCompanyProfileByUserId(userId: string) {
  const profile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: companyProfileSelect,
  });

  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Company profile not found.");
  }

  return profile;
}

export async function getCompanyProfileById(companyProfileId: string) {
  const profile = await prisma.companyProfile.findUnique({
    where: { id: companyProfileId },
    select: companyProfileSelect,
  });

  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Company profile not found.");
  }

  return profile;
}

export async function updateCompanyProfile(
  userId: string,
  input: UpdateCompanyProfileInput,
) {
  const existing = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Company profile not found.");
  }

  return prisma.companyProfile.update({
    where: { userId },
    data: input,
    select: companyProfileSelect,
  });
}
