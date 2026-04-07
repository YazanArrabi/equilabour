import { Router } from "express";

import { UserRole } from "../../../generated/prisma/client.js";
import { requireAuth } from "../auth/require-auth.js";
import { requireRole } from "../auth/require-role.js";
import * as companyProfileController from "./company-profile.controller.js";
import * as workerProfileController from "./worker-profile.controller.js";

const router = Router();

// Worker profile routes
router.get(
  "/workers/me",
  requireAuth,
  requireRole(UserRole.worker),
  workerProfileController.getMyWorkerProfile,
);
router.patch(
  "/workers/me",
  requireAuth,
  requireRole(UserRole.worker),
  workerProfileController.updateMyWorkerProfile,
);
router.get(
  "/workers/:workerId",
  requireAuth,
  workerProfileController.getWorkerProfileById,
);

// Company profile routes
router.get(
  "/companies/me",
  requireAuth,
  requireRole(UserRole.company),
  companyProfileController.getMyCompanyProfile,
);
router.patch(
  "/companies/me",
  requireAuth,
  requireRole(UserRole.company),
  companyProfileController.updateMyCompanyProfile,
);
router.get(
  "/companies/:companyId",
  requireAuth,
  companyProfileController.getCompanyProfileById,
);

export default router;
