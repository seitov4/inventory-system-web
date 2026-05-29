import express from "express";
import * as platformController from "../controllers/platform.controller.js";
import platformAuthRouter from "./platformAuth.routes.js";
import platformUsersRouter from "./platformUsers.routes.js";
import {
    platformAuthRequired,
    requirePlatformRole,
} from "../middleware/platformAuth.middleware.js";
import { PLATFORM_ROLES } from "../services/platformAuth.service.js";

const router = express.Router();

// Auth
router.use("/auth", platformAuthRouter);

router.use(platformAuthRequired);
router.use(requirePlatformRole(PLATFORM_ROLES));

// Platform admins. /users is kept as the existing platform UI endpoint and
// intentionally returns platform admins only, never tenant users.
router.use("/admins", platformUsersRouter);
router.use("/users", platformUsersRouter);

// Stores
router.get("/stores", platformController.listStores);
router.post("/stores", platformController.createStore);
router.post("/stores/:id/suspend", platformController.suspendStore);
router.post("/stores/:id/resume", platformController.resumeStore);
router.post("/stores/:id/archive", platformController.archiveStore);
router.get("/stores/:id", platformController.getStoreDetails);
router.get("/stores/:id/health", platformController.getStoreHealth);
router.get("/stores/:id/activity", platformController.getStoreActivity);

// Health & metrics
router.get("/health/backend", platformController.getBackendHealth);
router.get("/health/database", platformController.getDatabaseHealth);
router.get("/health/system", platformController.getSystemHealth);

// Logs & activity
router.get("/logs", platformController.getPlatformLogs);
router.get("/activity", platformController.getActivityFeed);

// Metrics
router.get("/metrics/summary", platformController.getMetricsSummary);
router.get("/metrics/growth", platformController.getMetricsGrowth);

export default router;
