import { Router } from "express";
import { chatWithAiController } from "../controllers/ai.controller.js";
import { tenantAuthRequired } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/chat", tenantAuthRequired, chatWithAiController);

export default router;

