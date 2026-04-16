import express from "express";
import * as platformController from "../controllers/platform.controller.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = express.Router();

// Auth
router.post("/auth/login", platformController.login);
router.post("/auth/logout", authRequired, platformController.logout);
router.get("/auth/me", authRequired, platformController.me);

// Stores
router.get("/stores", authRequired, platformController.listStores);
router.post("/stores", authRequired, platformController.createStore);
router.post("/stores/:id/suspend", authRequired, platformController.suspendStore);
router.post("/stores/:id/resume", authRequired, platformController.resumeStore);
router.post("/stores/:id/archive", authRequired, platformController.archiveStore);
router.get("/stores/:id", authRequired, platformController.getStoreDetails);
router.get("/stores/:id/health", authRequired, platformController.getStoreHealth);
router.get("/stores/:id/activity", authRequired, platformController.getStoreActivity);

// Health & metrics
router.get("/health/backend", platformController.getBackendHealth);
router.get("/health/database", platformController.getDatabaseHealth);
router.get("/health/system", platformController.getSystemHealth);

// Logs & activity
router.get("/logs", authRequired, platformController.getPlatformLogs);
router.get("/activity", authRequired, platformController.getActivityFeed);

// Metrics
router.get("/metrics/summary", authRequired, platformController.getMetricsSummary);
router.get("/metrics/growth", authRequired, platformController.getMetricsGrowth);

export default router;
