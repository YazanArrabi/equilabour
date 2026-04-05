import { UserRole, type User } from "../../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import type { AuthTokenPair, AuthUser } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  verifyRefreshToken,
} from "./auth.tokens.js";

type AuthResult = {
  user: AuthUser;
  tokens: AuthTokenPair;
};

type AuthUserRecord = Pick<User, "id" | "email" | "role">;

type LoginUserRecord = AuthUserRecord & {
  passwordHash: string;
};

function toAuthUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function issueTokenPair(userId: string, role: UserRole): AuthTokenPair {
  return {
    accessToken: createAccessToken(userId, role),
    refreshToken: createRefreshToken(userId, role),
  };
}

export async function getAuthUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return user ? toAuthUser(user) : null;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_ALREADY_IN_USE", "Email is already in use.");
  }

  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        ...(input.role === UserRole.worker
          ? {
              workerProfile: {
                create: {
                  fullName: input.fullName,
                  skills: [],
                  pastJobTitles: [],
                },
              },
            }
          : {
              companyProfile: {
                create: {
                  companyName: input.companyName,
                },
              },
            }),
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    const tokens = issueTokenPair(user.id, user.role);

    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(tokens.refreshToken),
        expiresAt: getRefreshTokenExpiresAt(),
      },
    });

    return {
      user: toAuthUser(user),
      tokens,
    };
  });
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const isPasswordValid = await comparePassword(
    input.password,
    (user as LoginUserRecord).passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const tokens = issueTokenPair(user.id, user.role);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: getRefreshTokenExpiresAt(),
    },
  });

  return {
    user: toAuthUser(user),
    tokens,
  };
}

export async function refresh(rawRefreshToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!storedToken) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid.");
  }

  if (storedToken.revokedAt) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid.");
  }

  if (storedToken.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, "REFRESH_TOKEN_EXPIRED", "Refresh token has expired.");
  }

  const payload = verifyRefreshToken(rawRefreshToken);

  if (payload.sub !== storedToken.userId || payload.role !== storedToken.user.role) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid.");
  }

  const nextTokens = issueTokenPair(storedToken.user.id, storedToken.user.role);

  await prisma.$transaction(async (tx) => {
    const revokeResult = await tx.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revokeResult.count !== 1) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid.");
    }

    await tx.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: hashRefreshToken(nextTokens.refreshToken),
        expiresAt: getRefreshTokenExpiresAt(),
      },
    });
  });

  return {
    user: toAuthUser(storedToken.user),
    tokens: nextTokens,
  };
}

export async function logout(rawRefreshToken: string | null): Promise<void> {
  if (!rawRefreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(rawRefreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
