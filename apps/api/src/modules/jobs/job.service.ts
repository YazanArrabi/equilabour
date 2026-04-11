import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { stripUndefined } from "../../utils/strip-undefined.js";
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

export async function listActiveJobs(
  query: JobQueryInput,
): Promise<PaginatedResult<Job>> {
  const { page, limit, search, location, employmentType, experienceLevel, payMin, payMax } = query;
  const skip = (page - 1) * limit;

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
  return jobs.map((j) => j.location).filter((l): l is string => l !== null);
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
