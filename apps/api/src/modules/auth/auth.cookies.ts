import type { CookieOptions, Response } from "express";

import type { AuthTokenPair } from "./auth.types.js";
import { authConfig } from "./auth.tokens.js";

function buildCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: authConfig.secureCookies,
    sameSite: authConfig.sameSite,
    path: "/",
    maxAge,
  };
}

function buildClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: authConfig.secureCookies,
    sameSite: authConfig.sameSite,
    path: "/",
  };
}

export function setAuthCookies(res: Response, tokens: AuthTokenPair): void {
  res.cookie(
    authConfig.accessTokenCookieName,
    tokens.accessToken,
    buildCookieOptions(authConfig.accessTokenTtlSeconds * 1000),
  );

  res.cookie(
    authConfig.refreshTokenCookieName,
    tokens.refreshToken,
    buildCookieOptions(authConfig.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
  );
}

export function clearAuthCookies(res: Response): void {
  const options = buildClearCookieOptions();

  res.clearCookie(authConfig.accessTokenCookieName, options);
  res.clearCookie(authConfig.refreshTokenCookieName, options);
}
