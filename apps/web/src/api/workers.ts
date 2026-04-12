import type { PaginatedResult } from "./client";
import { apiFetch } from "./client";

export interface PublicWorkerProfile {
  id: string;
  fullName: string;
  location: string | null;
  skills: string[];
  yearsOfExperience: number;
  pastJobTitles: string[];
  workExperienceSummary: string | null;
}

export type ExperienceLevel = "entry" | "junior" | "mid" | "senior";

export interface WorkerListParams {
  search?: string;
  skills?: string;
  experienceLevel?: ExperienceLevel[];
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: "updatedAt" | "skillRating";
}

export function listWorkers(params?: WorkerListParams) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.skills) query.set("skills", params.skills);
  if (params?.experienceLevel?.length) query.set("experienceLevel", params.experienceLevel.join(","));
  if (params?.location) query.set("location", params.location);
  if (params?.page !== undefined) query.set("page", String(params.page));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  const qs = query.toString();
  return apiFetch<PaginatedResult<PublicWorkerProfile>>(`/profiles/workers${qs ? `?${qs}` : ""}`);
}

export function listWorkerLocations(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch<string[]>(`/profiles/workers/locations${qs}`);
}

export interface WorkerProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  location: string | null;
  profilePictureFileId: string | null;
  skills: string[];
  yearsOfExperience: number;
  workExperienceSummary: string | null;
  pastJobTitles: string[];
  employmentHistory: string | null;
  createdAt: string;
  updatedAt: string;
}

// phoneNumber and email are verified credentials — they cannot be changed
// through profile editing. A dedicated verification flow is required.
export interface UpdateWorkerProfileInput {
  fullName?: string;
  location?: string | null;
  skills?: string[];
  yearsOfExperience?: number;
  workExperienceSummary?: string | null;
  pastJobTitles?: string[];
  employmentHistory?: string | null;
}

export interface AIAnalysis {
  id: string;
  workerProfileId: string;
  status: "fresh" | "stale" | "failed";
  skillSummary: string;
  skillRating: number;
  topSkills: string[];
  matchRecommendations: {
    suggestedRoles: string[];
    suggestedIndustries: string[];
    notes: string;
  };
  candidateRecommendations: {
    strengths: string[];
    areasForImprovement: string[];
    profileCompletenessScore: number;
  };
  lastAnalyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export function getMyWorkerProfile() {
  return apiFetch<WorkerProfile>("/profiles/workers/me");
}

export function updateMyWorkerProfile(input: UpdateWorkerProfileInput) {
  return apiFetch<WorkerProfile>("/profiles/workers/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getWorkerProfile(workerId: string) {
  return apiFetch<WorkerProfile>(`/profiles/workers/${workerId}`);
}

export function getWorkerAiAnalysis(workerIdOrMe: string) {
  return apiFetch<{ analysis: AIAnalysis | null }>(
    `/profiles/workers/${workerIdOrMe}/ai-analysis`,
  );
}
