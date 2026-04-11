import type { PaginatedResult } from "./client";
import { apiFetch } from "./client";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Application {
  id: string;
  jobPostingId: string;
  jobTitle?: string;
  workerProfileId: string;
  workerName?: string;
  message: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export interface ApplyToJobInput {
  message?: string;
}

export interface ApplicationListParams {
  page?: number;
  limit?: number;
}

export function applyToJob(jobId: string, input?: ApplyToJobInput) {
  return apiFetch<Application>(`/jobs/${jobId}/applications`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}

export function getMyApplications(params?: ApplicationListParams) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResult<Application>>(
    `/applications/mine${qs ? `?${qs}` : ""}`,
  );
}

export function getJobApplications(
  jobId: string,
  params?: ApplicationListParams,
) {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<PaginatedResult<Application>>(
    `/jobs/${jobId}/applications${qs ? `?${qs}` : ""}`,
  );
}

export function getApplication(applicationId: string) {
  return apiFetch<Application>(`/applications/${applicationId}`);
}

export function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected",
) {
  return apiFetch<Application>(`/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
