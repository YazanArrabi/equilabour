import type { Request, Response } from "express";

import { sendSuccess } from "../../utils/api-response.js";
import { AppError } from "../../utils/app-error.js";
import { clearAuthCookies, setAuthCookies } from "./auth.cookies.js";
import {
  loginSchema,
  registerSchema,
  resendOtpSchema,
  verifyOtpSchema,
} from "./auth.schemas.js";
import * as authService from "./auth.service.js";
import { authConfig } from "./auth.tokens.js";

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);

  // No cookies yet — caller must complete email + phone verification first.
  return sendSuccess(res, result, 201);
}

export async function verifyEmail(req: Request, res: Response) {
  const input = verifyOtpSchema.parse(req.body);
  const result = await authService.verifyEmail(input);

  return sendSuccess(res, result);
}

export async function verifyPhone(req: Request, res: Response) {
  const input = verifyOtpSchema.parse(req.body);
  const result = await authService.verifyPhone(input);

  setAuthCookies(res, result.tokens);

  return sendSuccess(res, result.user);
}

export async function resendOtp(req: Request, res: Response) {
  const input = resendOtpSchema.parse(req.body);
  await authService.resendOtp(input);

  return sendSuccess(res, { sent: true });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  setAuthCookies(res, result.tokens);

  return sendSuccess(res, result.user);
}

export async function refresh(req: Request, res: Response) {
  const rawRefreshToken = req.cookies?.[authConfig.refreshTokenCookieName];

  if (typeof rawRefreshToken !== "string" || rawRefreshToken.length === 0) {
    throw new AppError(401, "UNAUTHORIZED", "Refresh token is required.");
  }

  const result = await authService.refresh(rawRefreshToken);

  setAuthCookies(res, result.tokens);

  return sendSuccess(res, result.user);
}

export async function logout(req: Request, res: Response) {
  const rawRefreshToken =
    typeof req.cookies?.[authConfig.refreshTokenCookieName] === "string"
      ? req.cookies[authConfig.refreshTokenCookieName]
      : null;

  await authService.logout(rawRefreshToken);
  clearAuthCookies(res);

  return sendSuccess(res, { loggedOut: true });
}

export async function me(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return sendSuccess(res, req.auth.user);
}
