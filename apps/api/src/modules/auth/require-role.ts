import type { NextFunction, Request, Response } from "express";

import type { UserRole } from "../../../generated/prisma/client.js";
import { AppError } from "../../utils/app-error.js";

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError(401, "UNAUTHORIZED", "Authentication is required."));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(
        new AppError(
          403,
          "FORBIDDEN",
          "You are not allowed to access this resource.",
        ),
      );
      return;
    }

    next();
  };
}
