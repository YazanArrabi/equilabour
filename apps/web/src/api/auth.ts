import { apiFetch } from "./client";

export interface AuthUserData {
  id: string;
  email: string;
  role: "worker" | "company";
  profileId: string | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  phoneNumber: string;
  role: "worker" | "company";
  fullName?: string;
  companyName?: string;
}

export interface PendingResult {
  pendingToken: string;
}

export interface VerifyOtpInput {
  pendingToken: string;
  code: string;
}

export interface ResendOtpInput {
  pendingToken: string;
}

export function getMe() {
  return apiFetch<AuthUserData>("/auth/me");
}

export function login(input: LoginInput) {
  return apiFetch<AuthUserData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput) {
  return apiFetch<PendingResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyEmail(input: VerifyOtpInput) {
  return apiFetch<PendingResult>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function verifyPhone(input: VerifyOtpInput) {
  return apiFetch<AuthUserData>("/auth/verify-phone", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resendOtp(input: ResendOtpInput) {
  return apiFetch<{ sent: boolean }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiFetch<null>("/auth/logout", { method: "POST" });
}
