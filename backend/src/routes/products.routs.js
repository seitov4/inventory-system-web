import { Router } from "express";
import {
    listProducts,
    getProduct,
    getProductByBarcodeController,
    lookupProductsController,
    getProductsLeftController,
    getLowStockController,
    createProductController,
    updateProductController,
    deleteProductController,
    importProductsController,
} from "../controllers/products.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authRequired, listProducts);
router.get("/lookup", authRequired, lookupProductsController);
router.get("/left", authRequired, getProductsLeftController);
router.get(
    "/low-stock",
    authRequired,
    requireRole("manager", "owner"),
    getLowStockController
);
router.get("/barcode/:code", authRequired, getProductByBarcodeController);
router.get("/:id", authRequired, getProduct);

router.post(
    "/",
    authRequired,
    requireRole("manager", "owner"),
    createProductController
);

// Bulk import products from CSV/XLSX
router.post(
    "/import",
    authRequired,
    requireRole("manager", "owner"),
    importProductsController
);

router.put(
    "/:id",
    authRequired,
    requireRole("manager", "owner"),
    updateProductController
);

router.delete(
    "/:id",
    authRequired,
    requireRole("owner"),
    deleteProductController
);

export default router;
