import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { stripUndefined } from "../../utils/strip-undefined.js";
import { mergeWithGlobalCities } from "../../lib/cities.js";
import type {
  CreateJobInput,
  JobQueryInput,
  MyJobsQueryInput,
  UpdateJobInput,
} from "./job.schemas.js";

const jobSelect = {
  id: true,
  companyProfileId: true,
  companyProfile: { select: { companyName: true } },
  title: true,
  description: true,
  requiredSkills: true,
  experienceLevel: true,
  employmentType: true,
  salary: true,
  location: true,
  payMin: true,
  payMax: true,
  status: true,
  postedAt: true,
  updatedAt: true,
} as const;

export type Job = {
  id: string;
  companyProfileId: string;
  companyName: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  employmentType: string;
  salary: string | null;
  location: string | null;
  payMin: number | null;
  payMax: number | null;
  status: string;
  postedAt: Date;
  updatedAt: Date;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmtJob(raw: any): Job {
  const { companyProfile, ...rest } = raw as Record<string, unknown>;
  return {
    ...rest,
    companyName: (companyProfile as { companyName: string } | null)?.companyName ?? "",
  } as Job;
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function createJob(
  userId: string,
  input: CreateJobInput,
): Promise<Job> {
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!companyProfile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Company profile not found.");
  }

  const raw = await prisma.jobPosting.create({
    data: {
      companyProfileId: companyProfile.id,
      title: input.title,
      description: input.description,
      requiredSkills: input.requiredSkills,
      experienceLevel: input.experienceLevel,
      employmentType: input.employmentType,
      salary: input.salary ?? null,
      location: input.location ?? null,
      payMin: input.payMin ?? null,
      payMax: input.payMax ?? null,
    },
    select: jobSelect,
  });
  return fmtJob(raw);
}

// ─── Compatibility scoring ────────────────────────────────────────────────────

function scoreJobForWorker(
  job: { title: string; requiredSkills: string[] },
  topSkills: string[],
  suggestedRoles: string[],
): number {
  const lower = (s: string) => s.toLowerCase();
  const workerSkills = topSkills.map(lower);
  const jobSkills = job.requiredSkills.map(lower);
  const jobTitle = lower(job.title);

  // Skill overlap: each matching skill scores 3 points
  const skillOverlap = jobSkills.filter((s) => workerSkills.includes(s)).length;

  // Role match: any suggested role keyword found in job title scores 2 points
  const roleMatch = suggestedRoles.some((role) =>
    role
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 3 && jobTitle.includes(word)),
  )
    ? 1
    : 0;

  return skillOverlap * 3 + roleMatch * 2;
}

// ─── List jobs ────────────────────────────────────────────────────────────────

export async function listActiveJobs(
  query: JobQueryInput,
  requestingUserId?: string,
): Promise<PaginatedResult<Job>> {
  const { page, limit, search, location, employmentType, experienceLevel, payMin, payMax, sortBy } = query;

  const where = {
    status: "active" as const,
    ...(search !== undefined && search.trim() !== "" && {
      OR: [
        { title: { contains: search.trim(), mode: "insensitive" as const } },
        { description: { contains: search.trim(), mode: "insensitive" as const } },
      ],
    }),
    ...(location !== undefined && {
      location: { contains: location, mode: "insensitive" as const },
    }),
    ...(employmentType !== undefined && employmentType.length > 0 && { employmentType: { in: employmentType } }),
    ...(experienceLevel !== undefined && experienceLevel.length > 0 && { experienceLevel: { in: experienceLevel } }),
    ...(payMin !== undefined && { payMax: { gte: payMin } }),
    ...(payMax !== undefined && { payMin: { lte: payMax } }),
  };

  // ── Compatibility sort (worker only) ──────────────────────────────────────
  if (sortBy === "compatibility" && requestingUserId) {
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: requestingUserId },
      select: { id: true },
    });

    if (workerProfile) {
      const aiResult = await prisma.aIAnalysisResult.findFirst({
        where: { workerProfileId: workerProfile.id, status: "fresh" },
        orderBy: { lastAnalyzedAt: "desc" },
        select: { topSkills: true, matchRecommendations: true },
      });

      if (aiResult) {
        const topSkills = aiResult.topSkills;
        const recs = aiResult.matchRecommendations as { suggestedRoles: string[] };
        const suggestedRoles = recs.suggestedRoles ?? [];

        // Fetch all matching jobs (no pagination — scored in memory)
        const rawAll = await prisma.jobPosting.findMany({
          where,
          select: jobSelect,
          orderBy: { postedAt: "desc" },
        });

        const scored = rawAll
          .map((raw) => ({
            job: fmtJob(raw),
            score: scoreJobForWorker(raw, topSkills, suggestedRoles),
          }))
          .sort((a, b) => b.score - a.score || b.job.postedAt.getTime() - a.job.postedAt.getTime());

        const total = scored.length;
        const skip = (page - 1) * limit;
        const items = scored.slice(skip, skip + limit).map((s) => s.job);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }
    }
  }

  // ── Default: date sort ────────────────────────────────────────────────────
  const skip = (page - 1) * limit;
  const [total, rawItems] = await prisma.$transaction([
    prisma.jobPosting.count({ where }),
    prisma.jobPosting.findMany({
      where,
      select: jobSelect,
      skip,
      take: limit,
      orderBy: { postedAt: "desc" },
    }),
  ]);

  return {
    items: rawItems.map(fmtJob),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listMyJobs(
  userId: string,
  query: MyJobsQueryInput,
): Promise<PaginatedResult<Job>> {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!companyProfile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Company profile not found.");
  }

  const where = {
    companyProfileId: companyProfile.id,
    ...(status !== undefined && { status }),
  };

  const [total, rawItems] = await prisma.$transaction([
    prisma.jobPosting.count({ where }),
    prisma.jobPosting.findMany({
      where,
      select: jobSelect,
      skip,
      take: limit,
      orderBy: { postedAt: "desc" },
    }),
  ]);

  return {
    items: rawItems.map(fmtJob),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getJobById(
  jobId: string,
  requestingUserId: string,
): Promise<Job> {
  const job = await prisma.jobPosting.findFirst({
    where: {
      id: jobId,
      status: { not: "deleted" },
      OR: [
        { status: "active" },
        { companyProfile: { userId: requestingUserId } },
      ],
    },
    select: jobSelect,
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  return fmtJob(job);
}

export async function updateJob(
  userId: string,
  jobId: string,
  input: UpdateJobInput,
): Promise<Job> {
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { companyProfile: { select: { userId: true } } },
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  if (job.companyProfile.userId !== userId) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  if (job.status === "deleted") {
    throw new AppError(409, "JOB_DELETED", "Cannot edit a deleted job.");
  }

  const raw = await prisma.jobPosting.update({
    where: { id: jobId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: stripUndefined(input) as any,
    select: jobSelect,
  });
  return fmtJob(raw);
}

export async function updateJobStatus(
  userId: string,
  jobId: string,
  newStatus: "active" | "closed",
): Promise<Job> {
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { companyProfile: { select: { userId: true } } },
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  if (job.companyProfile.userId !== userId) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  if (job.status === "deleted") {
    throw new AppError(
      409,
      "INVALID_STATE_TRANSITION",
      "Cannot change the status of a deleted job.",
    );
  }

  if (job.status === newStatus) {
    const raw = await prisma.jobPosting.findUniqueOrThrow({
      where: { id: jobId },
      select: jobSelect,
    });
    return fmtJob(raw);
  }

  const raw = await prisma.jobPosting.update({
    where: { id: jobId },
    data: { status: newStatus },
    select: jobSelect,
  });
  return fmtJob(raw);
}

export async function listJobLocations(q?: string): Promise<string[]> {
  const jobs = await prisma.jobPosting.findMany({
    where: {
      status: "active",
      location: { not: null },
    },
    select: { location: true },
    distinct: ["location"],
    orderBy: { location: "asc" },
  });
  const dbLocations = jobs.map((j) => j.location).filter((l): l is string => l !== null);
  return mergeWithGlobalCities(dbLocations, q, 30);
}

export async function softDeleteJob(
  userId: string,
  jobId: string,
): Promise<Job> {
  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: { companyProfile: { select: { userId: true } } },
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  if (job.companyProfile.userId !== userId) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  if (job.status === "deleted") {
    const raw = await prisma.jobPosting.findUniqueOrThrow({
      where: { id: jobId },
      select: jobSelect,
    });
    return fmtJob(raw);
  }

  const raw = await prisma.jobPosting.update({
    where: { id: jobId },
    data: { status: "deleted" },
    select: jobSelect,
  });
  return fmtJob(raw);
}
