import {
    getAllProducts,
    getProductById,
    getProductByBarcode,
    getProductsWithLeft,
    getLowStockProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    importProducts,
} from "../services/products.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { success } from "../utils/response.js";

export async function listProducts(req, res, next) {
    try {
        const products = await getAllProducts();
        return success(res, products);
    } catch (err) {
        return next(err);
    }
}

export async function getProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await getProductById(id);
        if (!product) {
            return next(createAppError(ERROR_CODES.PRODUCT_NOT_FOUND, 404));
        }
        return success(res, product);
    } catch (err) {
        return next(err);
    }
}

export async function getProductByBarcodeController(req, res, next) {
    try {
        const { code } = req.params;
        const product = await getProductByBarcode(code);
        if (!product) {
            return next(createAppError(ERROR_CODES.PRODUCT_NOT_FOUND, 404));
        }
        return success(res, product);
    } catch (err) {
        return next(err);
    }
}

export async function getProductsLeftController(req, res, next) {
    try {
        const rows = await getProductsWithLeft();
        return success(res, rows);
    } catch (err) {
        return next(err);
    }
}

export async function getLowStockController(req, res, next) {
    try {
        const rows = await getLowStockProducts();
        return success(res, rows);
    } catch (err) {
        return next(err);
    }
}

export async function createProductController(req, res, next) {
    try {
        const product = await createProduct(req.body);
        return success(res, product, 201);
    } catch (err) {
        if (err.code === "23505") {
            if (err.detail && err.detail.includes("sku")) {
                return next(
                    createAppError(ERROR_CODES.PRODUCT_SKU_EXISTS, 409, {
                        sku: req.body.sku,
                    })
                );
            }
            if (err.detail && err.detail.includes("barcode")) {
                return next(
                    createAppError(ERROR_CODES.PRODUCT_BARCODE_EXISTS, 409, {
                        barcode: req.body.barcode,
                    })
                );
            }
            return next(createAppError(ERROR_CODES.PRODUCT_UNIQUE_CONSTRAINT, 409));
        }

        return next(err);
    }
}

export async function updateProductController(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await updateProduct(id, req.body);
        if (!updated) {
            return next(createAppError(ERROR_CODES.PRODUCT_NOT_FOUND, 404));
        }
        return success(res, updated);
    } catch (err) {
        if (err.code === "23505") {
            if (err.detail && err.detail.includes("sku")) {
                return next(
                    createAppError(ERROR_CODES.PRODUCT_SKU_EXISTS, 409, {
                        sku: req.body.sku,
                    })
                );
            }
            if (err.detail && err.detail.includes("barcode")) {
                return next(
                    createAppError(ERROR_CODES.PRODUCT_BARCODE_EXISTS, 409, {
                        barcode: req.body.barcode,
                    })
                );
            }
            return next(createAppError(ERROR_CODES.PRODUCT_UNIQUE_CONSTRAINT, 409));
        }

        return next(err);
    }
}

export async function deleteProductController(req, res, next) {
    try {
        const { id } = req.params;
        const result = await deleteProduct(id);
        if (!result) {
            return next(createAppError(ERROR_CODES.PRODUCT_NOT_FOUND, 404));
        }

        return success(
            res,
            {
                message: result.archived
                    ? "Product archived because it is used in history."
                    : "Product deleted.",
                archived: result.archived,
            },
            200
        );
    } catch (err) {
        return next(err);
    }
}

export async function importProductsController(req, res, next) {
    try {
        const { products } = req.body;

        if (!products || !Array.isArray(products)) {
            return next(createAppError(ERROR_CODES.PRODUCT_IMPORT_ARRAY_REQUIRED, 400));
        }

        if (products.length === 0) {
            return next(createAppError(ERROR_CODES.PRODUCT_IMPORT_ARRAY_EMPTY, 400));
        }

        if (products.length > 1000) {
            return next(createAppError(ERROR_CODES.PRODUCT_IMPORT_MAX_LIMIT, 400));
        }

        const result = await importProducts(products);
        return success(res, result, 201);
    } catch (err) {
        return next(err);
    }
}
