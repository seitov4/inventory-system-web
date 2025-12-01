import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import { getAllUsers } from "../services/users.service.js";

const router = Router();

// GET /api/users
router.get(
    "/",
    authRequired,
    requireRole("owner", "admin"),
    async (req, res, next) => {
        try {
            const users = await getAllUsers();
            res.json(users);
        } catch (err) {
            next(err);
        }
    }
);

export default router;
