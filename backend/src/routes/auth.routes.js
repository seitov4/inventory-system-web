import { Router } from "express";
import { login, register, me, logout } from "../controllers/auth.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// регистрацию логичнее ограничить owner/admin,
// но на этапе разработки можно временно открыть
router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);
router.post("/logout", authRequired, logout);

export default router;
