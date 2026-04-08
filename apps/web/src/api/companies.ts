import { apiFetch } from "./client";

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  location: string | null;
  industry: string | null;
  contactInfo: string | null;
  overview: string | null;
  logoFileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyProfileInput {
  companyName?: string;
  location?: string | null;
  industry?: string | null;
  contactInfo?: string | null;
  overview?: string | null;
}

export function getMyCompanyProfile() {
  return apiFetch<CompanyProfile>("/profiles/companies/me");
}

export function updateMyCompanyProfile(input: UpdateCompanyProfileInput) {
  return apiFetch<CompanyProfile>("/profiles/companies/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getCompanyProfile(companyId: string) {
  return apiFetch<CompanyProfile>(`/profiles/companies/${companyId}`);
}
