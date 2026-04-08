import { apiFetch } from "./client";

export interface WorkerProfile {
  id: string;
  userId: string;
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

export interface UpdateWorkerProfileInput {
  fullName?: string;
  phoneNumber?: string | null;
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
