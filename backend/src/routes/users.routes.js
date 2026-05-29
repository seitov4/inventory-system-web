import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/users.controller.js";

const router = Router();

router.get("/", authRequired, requireRole("owner"), listUsers);

router.post("/", authRequired, requireRole("owner"), createUser);

router.put("/:id", authRequired, requireRole("owner"), updateUser);

router.delete("/:id", authRequired, requireRole("owner"), deleteUser);

export default router;
