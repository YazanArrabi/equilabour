import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { UpdateWorkerProfileInput } from "./worker-profile.schemas.js";
import { analyzeWorkerProfile } from "../ai/ai.service.js";

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

  const updated = await prisma.workerProfile.update({
    where: { userId },
    data: input,
    select: workerProfileSelect,
  });

  // Trigger AI analysis synchronously. Errors are handled internally and never propagate.
  await analyzeWorkerProfile(updated.id);

  return updated;
}

export async function getWorkerAiAnalysis(workerProfileId: string) {
  return prisma.aIAnalysisResult.findFirst({
    where: { workerProfileId },
    orderBy: { lastAnalyzedAt: "desc" },
    select: {
      id: true,
      workerProfileId: true,
      status: true,
      skillSummary: true,
      skillRating: true,
      topSkills: true,
      matchRecommendations: true,
      candidateRecommendations: true,
      lastAnalyzedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
