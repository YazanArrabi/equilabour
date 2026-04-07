import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import jobRoutes from "./modules/jobs/job.routes.js";
import profileRoutes from "./modules/profile/profile.routes.js";
import applicationRouter, { jobApplicationRouter } from "./modules/applications/application.routes.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/auth", authRoutes);
app.use("/profiles", profileRoutes);
app.use("/jobs", jobRoutes);
app.use("/jobs/:jobId/applications", jobApplicationRouter);
app.use("/applications", applicationRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
