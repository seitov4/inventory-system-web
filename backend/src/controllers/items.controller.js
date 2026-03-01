import { createProduct } from "../services/products.service.js";
import { success, error } from "../utils/response.js";

/**
 * POST /api/items
 * Create a new item (product)
 */
export async function createItem(req, res, next) {
    try {
        const { name, sku, barcode, purchase_price, sale_price, min_stock } = req.body;

        // Validate required field
        if (!name) {
            return error(res, "name обязателен", 400);
        }

        // Generate SKU if not provided (using timestamp + random number)
        let finalSku = sku;
        if (!finalSku || typeof finalSku !== "string" || finalSku.trim() === "") {
            finalSku = `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        // Create product using the same service
        const product = await createProduct({
            name,
            sku: finalSku,
            barcode,
            purchase_price,
            sale_price,
            min_stock,
        });

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

