import { createHash } from "node:crypto";

import jwt from "jsonwebtoken";

import { UserRole } from "../../../generated/prisma/client.js";
import { AppError } from "../../utils/app-error.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.types.js";

type TokenKind = "access" | "refresh";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPositiveNumberEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`Environment variable ${name} must be a positive number.`);
  }

  return parsedValue;
}

export const authConfig = {
  accessTokenCookieName: "accessToken",
  refreshTokenCookieName: "refreshToken",
  accessTokenSecret: getRequiredEnv("JWT_ACCESS_SECRET"),
  refreshTokenSecret: getRequiredEnv("JWT_REFRESH_SECRET"),
  accessTokenTtlSeconds: getPositiveNumberEnv("ACCESS_TOKEN_TTL_SECONDS", 1800),
  refreshTokenTtlDays: getPositiveNumberEnv("REFRESH_TOKEN_TTL_DAYS", 7),
  secureCookies: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const validUserRoles = new Set(Object.values(UserRole));

function invalidTokenError(kind: TokenKind): AppError {
  return new AppError(
    401,
    kind === "access" ? "INVALID_ACCESS_TOKEN" : "INVALID_REFRESH_TOKEN",
    "Invalid token.",
  );
}

function expiredTokenError(kind: TokenKind): AppError {
  return new AppError(
    401,
    kind === "access" ? "ACCESS_TOKEN_EXPIRED" : "REFRESH_TOKEN_EXPIRED",
    "Token has expired.",
  );
}

function parseVerifiedPayload(
  payload: unknown,
  expectedType: TokenKind,
): AccessTokenPayload | RefreshTokenPayload {
  if (typeof payload !== "object" || payload === null) {
    throw invalidTokenError(expectedType);
  }

  const candidate = payload as {
    sub?: unknown;
    role?: unknown;
    type?: unknown;
  };

  if (typeof candidate.sub !== "string" || candidate.sub.length === 0) {
    throw invalidTokenError(expectedType);
  }

  if (
    typeof candidate.role !== "string" ||
    !validUserRoles.has(candidate.role as UserRole)
  ) {
    throw invalidTokenError(expectedType);
  }

  if (candidate.type !== expectedType) {
    throw invalidTokenError(expectedType);
  }

  return {
    sub: candidate.sub,
    role: candidate.role as UserRole,
    type: candidate.type as "access" | "refresh",
  };
}

function verifyToken(
  token: string,
  secret: string,
  expectedType: TokenKind,
): AccessTokenPayload | RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, secret);
    return parseVerifiedPayload(decoded, expectedType);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw expiredTokenError(expectedType);
    }   

    if (error instanceof jwt.JsonWebTokenError) {
      throw invalidTokenError(expectedType);
    }

    throw error;
  }
}

export function createAccessToken(userId: string, role: UserRole): string {
  return jwt.sign(
    {
      sub: userId,
      role,
      type: "access",
    } satisfies AccessTokenPayload,
    authConfig.accessTokenSecret,
    {
      expiresIn: authConfig.accessTokenTtlSeconds,
    },
  );
}

export function createRefreshToken(userId: string, role: UserRole): string {
  return jwt.sign(
    {
      sub: userId,
      role,
      type: "refresh",
    } satisfies RefreshTokenPayload,
    authConfig.refreshTokenSecret,
    {
      expiresIn: `${authConfig.refreshTokenTtlDays}d`,
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return verifyToken(token, authConfig.accessTokenSecret, "access") as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return verifyToken(token, authConfig.refreshTokenSecret, "refresh") as RefreshTokenPayload;
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpiresAt(): Date {
  return new Date(
    Date.now() + authConfig.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  );
}
