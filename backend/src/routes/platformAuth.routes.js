import { Router } from "express";
import { login, logout, me } from "../controllers/platformAuth.controller.js";
import { platformAuthRequired } from "../middleware/platformAuth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", platformAuthRequired, me);
router.post("/logout", platformAuthRequired, logout);

export default router;
