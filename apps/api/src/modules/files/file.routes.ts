import { Router } from "express";

import { requireAuth } from "../auth/require-auth.js";
import * as fileController from "./file.controller.js";

const router = Router();

// /mine MUST be registered before /:fileId to prevent "mine" being treated as an ID
router.post("/upload-url", requireAuth, fileController.requestUploadUrl);
router.post("/confirm", requireAuth, fileController.confirmUpload);
router.get("/mine", requireAuth, fileController.getMyFiles);
router.get("/:fileId", requireAuth, fileController.getFileDownloadUrl);
router.delete("/:fileId", requireAuth, fileController.deleteFile);

export default router;
