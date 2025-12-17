import {
    createSale as createSaleService,
    getSaleById as getSaleByIdService,
    returnSale as returnSaleService,
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getSalesChart,
} from "../services/sales.service.js";
import { success, error } from "../utils/response.js";

/**
 * POST /api/sales
 * Create sale (POS)
 */
export async function createSale(req, res, next) {
    try {
        const cashier_id = req.user?.id;
        const { store_id, warehouse_id, items, discount, payment_type } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return error(res, "Список позиций продажи не может быть пустым", 400);
        }

        const result = await createSaleService({
            cashier_id,
            store_id,
            warehouse_id,
            items,
            discount: discount || 0,
            payment_type: payment_type || "CASH",
        });

        return success(res, result, 201);
    } catch (err) {
        // Handle specific errors
        if (
            err.message.includes("обязателен") ||
            err.message.includes("должен быть") ||
            err.message.includes("пуст") ||
            err.message.includes("неотрицательным")
        ) {
            return error(res, err.message, 400);
        }

        if (err.message.includes("Недостаточно товара")) {
            return error(res, err.message, 409);
        }

        next(err);
    }
}

/**
 * GET /api/sales/:id
 * Get sale by ID
 */
export async function getSaleById(req, res, next) {
    try {
        const { id } = req.params;
        const sale = await getSaleByIdService(id);
        if (!sale) {
            return error(res, "Продажа не найдена", 404);
        }
        return success(res, sale);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/sales/:id/return
 * Return sale
 */
export async function createSaleReturn(req, res, next) {
    try {
        const { id } = req.params;
        const { warehouse_id } = req.body;

        if (!warehouse_id) {
            return error(res, "warehouse_id обязателен для возврата", 400);
        }

        const result = await returnSaleService({
            sale_id: id,
            user_id: req.user?.id,
            warehouse_id,
        });

        return success(res, result, 200);
    } catch (err) {
        // Handle specific errors
        if (err.message.includes("не найдена")) {
            return error(res, err.message, 404);
        }

        if (err.message.includes("уже возвращена")) {
            return error(res, err.message, 409);
        }

        if (err.message.includes("обязателен") || err.message.includes("не содержит")) {
            return error(res, err.message, 400);
        }

        next(err);
    }
}

// Analytics controllers (unchanged)
export async function getDailySalesController(req, res, next) {
    try {
        const data = await getDailySales();
        return success(res, data);
    } catch (err) {
        next(err);
    }
}

export async function getWeeklySalesController(req, res, next) {
    try {
        const data = await getWeeklySales();
        return success(res, data);
    } catch (err) {
        next(err);
    }
}

export async function getMonthlySalesController(req, res, next) {
    try {
        const data = await getMonthlySales();
        return success(res, data);
    } catch (err) {
        next(err);
    }
}

export async function getSalesChartController(req, res, next) {
    try {
        const data = await getSalesChart();
        return success(res, data);
    } catch (err) {
        next(err);
    }
}
