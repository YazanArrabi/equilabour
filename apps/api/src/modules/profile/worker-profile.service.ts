import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { UpdateWorkerProfileInput } from "./worker-profile.schemas.js";

const workerProfileSelect = {
  id: true,
  userId: true,
  fullName: true,
  phoneNumber: true,
  location: true,
  profilePictureFileId: true,
  skills: true,
  yearsOfExperience: true,
  workExperienceSummary: true,
  pastJobTitles: true,
  employmentHistory: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getWorkerProfileByUserId(userId: string) {
  const profile = await prisma.workerProfile.findUnique({
    where: { userId },
    select: workerProfileSelect,
  });

  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
  }

  return profile;
}

export async function getWorkerProfileById(workerProfileId: string) {
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: workerProfileSelect,
  });

  if (!profile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
  }

  return profile;
}

export async function updateWorkerProfile(
  userId: string,
  input: UpdateWorkerProfileInput,
) {
  const existing = await prisma.workerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
  }

  return prisma.workerProfile.update({
    where: { userId },
    data: input,
    select: workerProfileSelect,
  });
}
