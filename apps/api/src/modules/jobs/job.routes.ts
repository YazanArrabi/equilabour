import { Router } from "express";

import { UserRole } from "../../../generated/prisma/client.js";
import { requireAuth } from "../auth/require-auth.js";
import { requireRole } from "../auth/require-role.js";
import * as jobController from "./job.controller.js";

const router = Router();

// /mine MUST be registered before /:jobId to prevent "mine" being treated as a jobId
router.get(
  "/mine",
  requireAuth,
  requireRole(UserRole.company),
  jobController.listMyJobs,
);

router.post(
  "/",
  requireAuth,
  requireRole(UserRole.company),
  jobController.createJob,
);

router.get("/", requireAuth, jobController.listActiveJobs);

// /locations MUST be registered before /:jobId to prevent "locations" being treated as a jobId
router.get("/locations", requireAuth, jobController.listJobLocations);

router.get("/:jobId", requireAuth, jobController.getJobById);

router.patch(
  "/:jobId",
  requireAuth,
  requireRole(UserRole.company),
  jobController.updateJob,
);

router.patch(
  "/:jobId/status",
  requireAuth,
  requireRole(UserRole.company),
  jobController.updateJobStatus,
);

router.delete(
  "/:jobId",
  requireAuth,
  requireRole(UserRole.company),
  jobController.softDeleteJob,
);

export default router;
