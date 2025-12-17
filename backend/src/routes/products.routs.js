import { Router } from "express";
import {
    listProducts,
    getProduct,
    getProductByBarcodeController,
    getProductsLeftController,
    getLowStockController,
    createProductController,
    updateProductController,
    deleteProductController,
} from "../controllers/products.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authRequired, listProducts);
router.get("/left", authRequired, getProductsLeftController);
router.get("/barcode/:code", authRequired, getProductByBarcodeController);
router.get("/:id", authRequired, getProduct);

router.get(
    "/low-stock",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getLowStockController
);

router.post(
    "/",
    authRequired,
    requireRole("manager", "owner", "admin"),
    createProductController
);

router.put(
    "/:id",
    authRequired,
    requireRole("manager", "owner", "admin"),
    updateProductController
);

router.delete(
    "/:id",
    authRequired,
    requireRole("owner", "admin"),
    deleteProductController
);

export default router;
