import {
    getAllProducts,
    getProductById,
    getProductByBarcode,
    getProductsWithLeft,
    getLowStockProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../services/products.service.js";
import { success, error } from "../utils/response.js";

export async function listProducts(req, res, next) {
    try {
        const products = await getAllProducts();
        return success(res, products);
    } catch (err) {
        next(err);
    }
}

export async function getProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await getProductById(id);
        if (!product) {
            return error(res, "Товар не найден", 404);
        }
        return success(res, product);
    } catch (err) {
        next(err);
    }
}

export async function getProductByBarcodeController(req, res, next) {
    try {
        const { code } = req.params;
        const product = await getProductByBarcode(code);
        if (!product) {
            return error(res, "Товар не найден", 404);
        }
        return success(res, product);
    } catch (err) {
        next(err);
    }
}

export async function getProductsLeftController(req, res, next) {
    try {
        const rows = await getProductsWithLeft();
        return success(res, rows);
    } catch (err) {
        next(err);
    }
}

export async function getLowStockController(req, res, next) {
    try {
        const rows = await getLowStockProducts();
        return success(res, rows);
    } catch (err) {
        next(err);
    }
}

export async function createProductController(req, res, next) {
    try {
        const product = await createProduct(req.body);
        return success(res, product, 201);
    } catch (err) {
        // Handle specific validation errors
        if (
            err.message.includes("обязательно") ||
            err.message.includes("не может быть пустым") ||
            err.message.includes("должна быть") ||
            err.message.includes("должен быть")
        ) {
            return error(res, err.message, 400);
        }

        // Handle duplicate errors
        if (err.message.includes("уже существует")) {
            return error(res, err.message, 409);
        }

        // Handle database constraint errors (fallback)
        if (err.code === "23505") {
            // PostgreSQL unique constraint violation
            if (err.detail && err.detail.includes("sku")) {
                return error(res, `Товар с SKU "${req.body.sku}" уже существует`, 409);
            }
            if (err.detail && err.detail.includes("barcode")) {
                return error(res, `Товар с штрихкодом "${req.body.barcode}" уже существует`, 409);
            }
            return error(res, "Нарушение уникальности данных", 409);
        }

        next(err);
    }
}

export async function updateProductController(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await updateProduct(id, req.body);
        if (!updated) {
            return error(res, "Товар не найден", 404);
        }
        return success(res, updated);
    } catch (err) {
        // Handle specific validation errors
        if (
            err.message.includes("обязательно") ||
            err.message.includes("не может быть пустым") ||
            err.message.includes("должна быть") ||
            err.message.includes("должен быть")
        ) {
            return error(res, err.message, 400);
        }

        // Handle duplicate errors
        if (err.message.includes("уже существует")) {
            return error(res, err.message, 409);
        }

        // Handle database constraint errors (fallback)
        if (err.code === "23505") {
            // PostgreSQL unique constraint violation
            if (err.detail && err.detail.includes("sku")) {
                return error(res, `Товар с SKU "${req.body.sku}" уже существует`, 409);
            }
            if (err.detail && err.detail.includes("barcode")) {
                return error(res, `Товар с штрихкодом "${req.body.barcode}" уже существует`, 409);
            }
            return error(res, "Нарушение уникальности данных", 409);
        }

        next(err);
    }
}

export async function deleteProductController(req, res, next) {
    try {
        const { id } = req.params;
        await deleteProduct(id);
        return success(res, { message: "Товар успешно удалён" }, 200);
    } catch (err) {
        next(err);
    }
}
