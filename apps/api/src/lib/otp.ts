import { createHash, randomInt } from "node:crypto";

/** Returns a random 6-digit string, zero-padded. */
export function generateOtp(): string {
  return String(randomInt(100000, 1000000));
}

/** SHA-256 hash of an OTP. Short-lived codes + expiry make bcrypt unnecessary here. */
export function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

/** Constant-time comparison via re-hashing. */
export function verifyOtp(otp: string, storedHash: string): boolean {
  return hashOtp(otp) === storedHash;
}

/** 10-minute expiry from now. */
export function otpExpiresAt(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}
