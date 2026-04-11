import { Router } from "express";

import * as authController from "./auth.controller.js";
import { requireAuth } from "./require-auth.js";

const router: Router = Router();

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/verify-phone", authController.verifyPhone);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
