import { Router } from "express";
import { listWarehouses } from "../controllers/warehouses.controller.js";
import { authRequired } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authRequired, listWarehouses);

export default router;
