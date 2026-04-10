import type { PaginatedResult } from "./client";
import { apiFetch } from "./client";

export type JobStatus = "active" | "closed" | "deleted";
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "freelance";
export type ExperienceLevel = "entry" | "junior" | "mid" | "senior";

export interface Job {
  id: string;
  companyProfileId: string;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  salary: string | null;
  location: string | null;
  payMin: number | null;
  payMax: number | null;
  status: JobStatus;
  postedAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  employmentType: EmploymentType;
  salary?: string;
  location?: string;
  payMin?: number | null;
  payMax?: number | null;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  requiredSkills?: string[];
  experienceLevel?: ExperienceLevel;
  employmentType?: EmploymentType;
  salary?: string | null;
  location?: string | null;
  payMin?: number | null;
  payMax?: number | null;
}

export interface JobListParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  employmentType?: EmploymentType[];
  experienceLevel?: ExperienceLevel[];
  payMin?: number;
  payMax?: number;
}

export function listJobs(params?: JobListParams) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.location) query.set("location", params.location);
  if (params?.employmentType?.length) query.set("employmentType", params.employmentType.join(","));
  if (params?.experienceLevel?.length) query.set("experienceLevel", params.experienceLevel.join(","));
  if (params?.payMin !== undefined) query.set("payMin", String(params.payMin));
  if (params?.payMax !== undefined) query.set("payMax", String(params.payMax));
  const qs = query.toString();
  return apiFetch<PaginatedResult<Job>>(`/jobs${qs ? `?${qs}` : ""}`);
}

export function listJobLocations(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<string[]>(`/jobs/locations${qs}`);
}

export function listMyJobs(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResult<Job>>(`/jobs/mine${qs ? `?${qs}` : ""}`);
}

export function getJob(jobId: string) {
  return apiFetch<Job>(`/jobs/${jobId}`);
}

export function createJob(input: CreateJobInput) {
  return apiFetch<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateJob(jobId: string, input: UpdateJobInput) {
  return apiFetch<Job>(`/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateJobStatus(jobId: string, status: "active" | "closed") {
  return apiFetch<Job>(`/jobs/${jobId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteJob(jobId: string) {
  return apiFetch<{ deleted: boolean; id: string }>(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}
