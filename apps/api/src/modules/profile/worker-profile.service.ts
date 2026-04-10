import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type { UpdateWorkerProfileInput, WorkerProfileQueryInput } from "./worker-profile.schemas.js";
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

const publicWorkerSelect = {
  id: true,
  fullName: true,
  location: true,
  skills: true,
  yearsOfExperience: true,
  pastJobTitles: true,
  workExperienceSummary: true,
} as const;

function experienceLevelToYears(level: string): { gte?: number; lte?: number } {
  switch (level) {
    case "entry":  return { gte: 0, lte: 1 };
    case "junior": return { gte: 1, lte: 3 };
    case "mid":    return { gte: 3, lte: 5 };
    case "senior": return { gte: 5 };
    default:       return {};
  }
}

export async function listWorkerProfiles(query: WorkerProfileQueryInput) {
  const { page, limit, search, skills, experienceLevel, location } = query;
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      ...(search !== undefined && search.trim() !== ""
        ? [
            {
              OR: [
                { fullName: { contains: search.trim(), mode: "insensitive" as const } },
                { workExperienceSummary: { contains: search.trim(), mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
      ...(skills && skills.length > 0 ? [{ skills: { hasSome: skills } }] : []),
      ...(location !== undefined && location.trim() !== ""
        ? [{ location: { contains: location.trim(), mode: "insensitive" as const } }]
        : []),
      ...(experienceLevel !== undefined && experienceLevel.length > 0
        ? [
            {
              OR: experienceLevel.map((lvl) => ({
                yearsOfExperience: experienceLevelToYears(lvl),
              })),
            },
          ]
        : []),
    ],
  };

  const [total, items] = await prisma.$transaction([
    prisma.workerProfile.count({ where }),
    prisma.workerProfile.findMany({
      where,
      select: publicWorkerSelect,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listWorkerLocations(q?: string): Promise<string[]> {
  const profiles = await prisma.workerProfile.findMany({
    where: {
      location: {
        not: null,
        ...(q ? { contains: q, mode: "insensitive" as const } : {}),
      },
    },
    select: { location: true },
    distinct: ["location"],
    orderBy: { location: "asc" },
    take: 20,
  });
  return profiles.map((p) => p.location).filter((l): l is string => l !== null);
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
