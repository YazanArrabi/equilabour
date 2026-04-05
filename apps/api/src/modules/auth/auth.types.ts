import type { User, UserRole } from "../../../generated/prisma/client.js";

export type AuthUser = Pick<User, "id" | "email" | "role">;

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  role: UserRole;
  type: "refresh";
};

export type AuthenticatedRequestContext = {
  userId: string;
  role: UserRole;
  user: AuthUser;
};

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};
