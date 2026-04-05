import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../utils/app-error.js";
import { authConfig, verifyAccessToken } from "./auth.tokens.js";
import { getAuthUserById } from "./auth.service.js";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawAccessToken = req.cookies?.[authConfig.accessTokenCookieName];

    if (typeof rawAccessToken !== "string" || rawAccessToken.length === 0) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const payload = verifyAccessToken(rawAccessToken);
    const user = await getAuthUserById(payload.sub);

    if (!user) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    req.auth = {
      userId: user.id,
      role: user.role,
      user,
    };

    next();
  } catch (error) {
    next(error);
  }
}
