import { Router } from "express";

import { UserRole } from "../../../generated/prisma/client.js";
import { requireAuth } from "../auth/require-auth.js";
import { requireRole } from "../auth/require-role.js";
import * as applicationController from "./application.controller.js";

// Handles POST /jobs/:jobId/applications and GET /jobs/:jobId/applications
// mergeParams: true is required to access req.params.jobId from the parent route
export const jobApplicationRouter: Router = Router({ mergeParams: true });

jobApplicationRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.worker),
  applicationController.applyToJob,
);

jobApplicationRouter.get(
  "/",
  requireAuth,
  requireRole(UserRole.company),
  applicationController.listJobApplications,
);

// Handles GET /applications/mine, GET /applications/:applicationId,
// and PATCH /applications/:applicationId/status
// /mine MUST be registered before /:applicationId to prevent "mine" being treated as an ID
const applicationRouter: Router = Router();

applicationRouter.get(
  "/mine",
  requireAuth,
  requireRole(UserRole.worker),
  applicationController.getMyApplications,
);

applicationRouter.get(
  "/:applicationId",
  requireAuth,
  applicationController.getApplicationById,
);

applicationRouter.patch(
  "/:applicationId/status",
  requireAuth,
  requireRole(UserRole.company),
  applicationController.updateApplicationStatus,
);

export default applicationRouter;
