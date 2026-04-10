import { Router } from "express";

import { UserRole } from "../../../generated/prisma/client.js";
import { requireAuth } from "../auth/require-auth.js";
import { requireRole } from "../auth/require-role.js";
import * as companyProfileController from "./company-profile.controller.js";
import * as workerProfileController from "./worker-profile.controller.js";

const router = Router();

// Worker list (browse)
router.get(
  "/workers",
  requireAuth,
  workerProfileController.listWorkerProfiles,
);

// /workers/locations MUST be registered before /workers/:workerId
router.get(
  "/workers/locations",
  requireAuth,
  workerProfileController.listWorkerLocations,
);

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
  "/workers/me/ai-analysis",
  requireAuth,
  requireRole(UserRole.worker),
  workerProfileController.getMyAiAnalysis,
);
router.get(
  "/workers/:workerId/ai-analysis",
  requireAuth,
  workerProfileController.getWorkerProfileAiAnalysis,
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
