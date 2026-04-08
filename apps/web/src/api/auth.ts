import { apiFetch } from "./client";

export interface AuthUserData {
  id: string;
  email: string;
  role: "worker" | "company";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: "worker" | "company";
  fullName?: string;
  companyName?: string;
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
  return apiFetch<AuthUserData>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiFetch<null>("/auth/logout", { method: "POST" });
}
