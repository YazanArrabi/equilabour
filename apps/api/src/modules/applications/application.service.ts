import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import type {
  ApplicationQueryInput,
  CreateApplicationInput,
} from "./application.schemas.js";

const applicationSelect = {
  id: true,
  jobPostingId: true,
  workerProfileId: true,
  message: true,
  status: true,
  appliedAt: true,
  updatedAt: true,
} as const;

const applicationWithJobSelect = {
  ...applicationSelect,
  jobPosting: { select: { title: true } },
} as const;

export type Application = {
  id: string;
  jobPostingId: string;
  workerProfileId: string;
  message: string | null;
  status: string;
  appliedAt: Date;
  updatedAt: Date;
};

export type ApplicationListItem = Application & { jobTitle: string };

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function createApplication(
  userId: string,
  jobId: string,
  input: CreateApplicationInput,
): Promise<Application> {
  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!workerProfile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: { id: true, status: true },
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  if (job.status !== "active") {
    throw new AppError(
      409,
      "JOB_NOT_ACCEPTING_APPLICATIONS",
      "This job is not accepting applications.",
    );
  }

  try {
    return await prisma.jobApplication.create({
      data: {
        workerProfileId: workerProfile.id,
        jobPostingId: jobId,
        message: input.message ?? null,
      },
      select: applicationSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        409,
        "ALREADY_APPLIED",
        "You have already applied to this job.",
      );
    }
    throw error;
  }
}

export async function listJobApplications(
  userId: string,
  jobId: string,
  query: ApplicationQueryInput,
): Promise<PaginatedResult<Application>> {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!companyProfile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Company profile not found.");
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: { id: true, companyProfileId: true },
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Job not found.");
  }

  if (job.companyProfileId !== companyProfile.id) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  const where = { jobPostingId: jobId };

  const [total, items] = await prisma.$transaction([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      select: applicationSelect,
      skip,
      take: limit,
      orderBy: { appliedAt: "desc" },
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

export async function getMyApplications(
  userId: string,
  query: ApplicationQueryInput,
): Promise<PaginatedResult<ApplicationListItem>> {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!workerProfile) {
    throw new AppError(404, "PROFILE_NOT_FOUND", "Worker profile not found.");
  }

  const where = { workerProfileId: workerProfile.id };

  const [total, rawItems] = await prisma.$transaction([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      select: applicationWithJobSelect,
      skip,
      take: limit,
      orderBy: { appliedAt: "desc" },
    }),
  ]);

  const items: ApplicationListItem[] = rawItems.map(({ jobPosting, ...app }) => ({
    ...app,
    jobTitle: jobPosting.title,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getApplicationById(
  userId: string,
  applicationId: string,
): Promise<Application> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      workerProfile: { select: { userId: true } },
      jobPosting: { select: { companyProfile: { select: { userId: true } } } },
    },
  });

  if (!application) {
    throw new AppError(
      404,
      "APPLICATION_NOT_FOUND",
      "Application not found.",
    );
  }

  const isApplyingWorker = application.workerProfile.userId === userId;
  const isOwningCompany =
    application.jobPosting.companyProfile.userId === userId;

  if (!isApplyingWorker && !isOwningCompany) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  return {
    id: application.id,
    jobPostingId: application.jobPostingId,
    workerProfileId: application.workerProfileId,
    message: application.message,
    status: application.status,
    appliedAt: application.appliedAt,
    updatedAt: application.updatedAt,
  };
}

export async function updateApplicationStatus(
  userId: string,
  applicationId: string,
  newStatus: "accepted" | "rejected",
): Promise<Application> {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: {
      jobPosting: { select: { companyProfile: { select: { userId: true } } } },
    },
  });

  if (!application) {
    throw new AppError(
      404,
      "APPLICATION_NOT_FOUND",
      "Application not found.",
    );
  }

  if (application.jobPosting.companyProfile.userId !== userId) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "You are not allowed to access this resource.",
    );
  }

  if (application.status !== "pending") {
    throw new AppError(
      409,
      "INVALID_STATE_TRANSITION",
      "Application status can only be changed from pending.",
    );
  }

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
    select: applicationSelect,
  });
}
