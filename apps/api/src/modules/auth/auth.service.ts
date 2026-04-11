import { UserRole, type User } from "../../../generated/prisma/client.js";

import { sendEmailOtp } from "../../lib/email.js";
import { generateOtp, hashOtp, otpExpiresAt, verifyOtp } from "../../lib/otp.js";
import { sendSmsOtp } from "../../lib/sms.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import type { AuthTokenPair, AuthUser } from "./auth.types.js";
import type { LoginInput, RegisterInput, ResendOtpInput, VerifyOtpInput } from "./auth.schemas.js";
import {
  createAccessToken,
  createPendingToken,
  createRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  verifyPendingToken,
  verifyRefreshToken,
} from "./auth.tokens.js";

type AuthResult = {
  user: AuthUser;
  tokens: AuthTokenPair;
};

type PendingResult = {
  pendingToken: string;
};

type AuthUserRecord = Pick<User, "id" | "email" | "role"> & {
  workerProfile: { id: string } | null;
  companyProfile: { id: string } | null;
};

type LoginUserRecord = AuthUserRecord & {
  passwordHash: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

function toAuthUser(user: AuthUserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profileId: user.workerProfile?.id ?? user.companyProfile?.id ?? null,
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
      workerProfile: { select: { id: true } },
      companyProfile: { select: { id: true } },
    },
  });

  return user ? toAuthUser(user) : null;
}

// ---------------------------------------------------------------------------
// Registration — no tokens issued. Returns pendingToken for email verification.
// ---------------------------------------------------------------------------

export async function register(input: RegisterInput): Promise<PendingResult> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(409, "EMAIL_ALREADY_IN_USE", "Email is already in use.");
  }

  const passwordHash = await hashPassword(input.password);
  const emailCode = generateOtp();

  // Send the email BEFORE writing to DB so a failed send doesn't leave an
  // orphaned unverified user record.
  await sendEmailOtp(input.email, emailCode);

  const user = await prisma.$transaction(async (tx) => {
    return tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        phoneNumber: input.phoneNumber,
        emailOtp: hashOtp(emailCode),
        emailOtpExpiry: otpExpiresAt(),
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
      select: { id: true },
    });
  });

  return { pendingToken: createPendingToken(user.id) };
}

// ---------------------------------------------------------------------------
// Email OTP verification — validates code, kicks off phone OTP.
// ---------------------------------------------------------------------------

export async function verifyEmail(input: VerifyOtpInput): Promise<PendingResult> {
  const { sub: userId } = verifyPendingToken(input.pendingToken);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      emailVerified: true,
      emailOtp: true,
      emailOtpExpiry: true,
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  if (!user.phoneNumber) {
    throw new AppError(500, "INTERNAL_ERROR", "Phone number missing on account.");
  }

  // If email is already verified (e.g. SMS failed on a previous attempt),
  // skip re-verification and just resend the phone OTP so the user can advance.
  if (user.emailVerified) {
    const phoneCode = generateOtp();
    await sendSmsOtp(user.phoneNumber, phoneCode);
    await prisma.user.update({
      where: { id: userId },
      data: { phoneOtp: hashOtp(phoneCode), phoneOtpExpiry: otpExpiresAt() },
    });
    return { pendingToken: createPendingToken(userId) };
  }

  if (!user.emailOtp || !user.emailOtpExpiry) {
    throw new AppError(400, "NO_OTP", "No verification code found. Request a new one.");
  }

  if (user.emailOtpExpiry.getTime() < Date.now()) {
    throw new AppError(400, "OTP_EXPIRED", "Verification code has expired. Request a new one.");
  }

  if (!verifyOtp(input.code, user.emailOtp)) {
    throw new AppError(400, "INVALID_OTP", "Invalid verification code.");
  }

  // Send SMS BEFORE updating DB — if it fails the user can retry email verification cleanly.
  const phoneCode = generateOtp();
  await sendSmsOtp(user.phoneNumber, phoneCode);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerified: true,
      emailOtp: null,
      emailOtpExpiry: null,
      phoneOtp: hashOtp(phoneCode),
      phoneOtpExpiry: otpExpiresAt(),
    },
  });

  return { pendingToken: createPendingToken(userId) };
}

// ---------------------------------------------------------------------------
// Phone OTP verification — validates code, issues full auth tokens.
// ---------------------------------------------------------------------------

export async function verifyPhone(input: VerifyOtpInput): Promise<AuthResult> {
  const { sub: userId } = verifyPendingToken(input.pendingToken);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      phoneOtp: true,
      phoneOtpExpiry: true,
      workerProfile: { select: { id: true } },
      companyProfile: { select: { id: true } },
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  if (!user.emailVerified) {
    throw new AppError(400, "EMAIL_NOT_VERIFIED", "Email must be verified first.");
  }

  if (user.phoneVerified) {
    throw new AppError(400, "ALREADY_VERIFIED", "Phone is already verified.");
  }

  if (!user.phoneOtp || !user.phoneOtpExpiry) {
    throw new AppError(400, "NO_OTP", "No verification code found. Request a new one.");
  }

  if (user.phoneOtpExpiry.getTime() < Date.now()) {
    throw new AppError(400, "OTP_EXPIRED", "Verification code has expired. Request a new one.");
  }

  if (!verifyOtp(input.code, user.phoneOtp)) {
    throw new AppError(400, "INVALID_OTP", "Invalid verification code.");
  }

  const tokens = issueTokenPair(user.id, user.role);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneOtp: null,
        phoneOtpExpiry: null,
      },
    });

    await tx.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(tokens.refreshToken),
        expiresAt: getRefreshTokenExpiresAt(),
      },
    });
  });

  return { user: toAuthUser(user), tokens };
}

// ---------------------------------------------------------------------------
// Resend OTP — resends whichever step the user is currently on.
// ---------------------------------------------------------------------------

export async function resendOtp(input: ResendOtpInput): Promise<void> {
  const { sub: userId } = verifyPendingToken(input.pendingToken);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found.");
  }

  if (user.phoneVerified) {
    throw new AppError(400, "ALREADY_VERIFIED", "Account is already fully verified.");
  }

  const code = generateOtp();
  const hash = hashOtp(code);
  const expiry = otpExpiresAt();

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailOtp: hash, emailOtpExpiry: expiry },
    });
    await sendEmailOtp(user.email, code);
  } else {
    if (!user.phoneNumber) {
      throw new AppError(500, "INTERNAL_ERROR", "Phone number missing on account.");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { phoneOtp: hash, phoneOtpExpiry: expiry },
    });
    await sendSmsOtp(user.phoneNumber, code);
  }
}

// ---------------------------------------------------------------------------
// Login — blocks unverified accounts and returns a pendingToken for resuming.
// ---------------------------------------------------------------------------

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      emailVerified: true,
      phoneVerified: true,
      workerProfile: { select: { id: true } },
      companyProfile: { select: { id: true } },
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

  if (!user.emailVerified || !user.phoneVerified) {
    const pendingToken = createPendingToken(user.id);
    throw new AppError(
      403,
      "ACCOUNT_NOT_VERIFIED",
      "Please complete account verification before signing in.",
      { pendingToken },
    );
  }

  const tokens = issueTokenPair(user.id, user.role);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: getRefreshTokenExpiresAt(),
    },
  });

  return { user: toAuthUser(user), tokens };
}

// ---------------------------------------------------------------------------
// Refresh + logout — unchanged
// ---------------------------------------------------------------------------

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
          workerProfile: { select: { id: true } },
          companyProfile: { select: { id: true } },
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
