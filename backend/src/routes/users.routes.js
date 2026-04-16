import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/users.controller.js";

const router = Router();

router.get("/", authRequired, requireRole("admin", "owner"), listUsers);

router.post("/", authRequired, requireRole("admin", "owner"), createUser);

router.put("/:id", authRequired, requireRole("admin", "owner"), updateUser);

router.delete("/:id", authRequired, requireRole("admin", "owner"), deleteUser);

export default router;
