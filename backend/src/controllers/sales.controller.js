import {
    createSale as createSaleService,
    getSaleById as getSaleByIdService,
    returnSale as returnSaleService,
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getSalesChart,
} from "../services/sales.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { success } from "../utils/response.js";

export async function createSale(req, res, next) {
    try {
        const cashier_id = req.user?.id;
        const { warehouse_id, items, discount, payment_type } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return next(createAppError(ERROR_CODES.SALES_ITEMS_REQUIRED, 400));
        }

        const result = await createSaleService({
            cashier_id,
            store_id: req.user.store_id,
            warehouse_id,
            items,
            discount: discount || 0,
            payment_type: payment_type || "CASH",
        });

        return success(res, result, 201);
    } catch (err) {
        return next(err);
    }
}

export async function getSaleById(req, res, next) {
    try {
        const { id } = req.params;
        const sale = await getSaleByIdService(req.user.store_id, id);
        if (!sale) {
            return next(createAppError(ERROR_CODES.SALES_NOT_FOUND, 404));
        }
        return success(res, sale);
    } catch (err) {
        return next(err);
    }
}

export async function createSaleReturn(req, res, next) {
    try {
        const { id } = req.params;
        const { warehouse_id } = req.body;

        if (!warehouse_id) {
            return next(createAppError(ERROR_CODES.SALES_RETURN_WAREHOUSE_REQUIRED, 400));
        }

        const result = await returnSaleService({
            sale_id: id,
            store_id: req.user.store_id,
            user_id: req.user?.id,
            warehouse_id,
        });

        return success(res, result, 200);
    } catch (err) {
        return next(err);
    }
}

export async function getDailySalesController(req, res, next) {
    try {
        const data = await getDailySales(req.user.store_id);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getWeeklySalesController(req, res, next) {
    try {
        const data = await getWeeklySales(req.user.store_id);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getMonthlySalesController(req, res, next) {
    try {
        const data = await getMonthlySales(req.user.store_id);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getSalesChartController(req, res, next) {
    try {
        const data = await getSalesChart(req.user.store_id);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}
