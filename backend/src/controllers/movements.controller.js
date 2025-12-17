import {
    applyMovement,
    getMovements as getMovementsService,
} from "../services/movements.service.js";
import { success, error } from "../utils/response.js";
import pool from "../utils/db.js";

export async function getMovements(req, res, next) {
    try {
        const limit = Number(req.query.limit || 100);
        const offset = Number(req.query.offset || 0);
        const product_id = req.query.product_id ? Number(req.query.product_id) : null;
        const warehouse_id = req.query.warehouse_id ? Number(req.query.warehouse_id) : null;
        const type = req.query.type || null;
        const date_from = req.query.date_from || null;
        const date_to = req.query.date_to || null;

        const rows = await getMovementsService({
            limit,
            offset,
            product_id,
            warehouse_id,
            type,
            date_from,
            date_to,
        });
        return success(res, rows);
    } catch (err) {
        next(err);
    }
}

export async function movementIn(req, res, next) {
    try {
        const { product_id, warehouse_id, warehouse_to, qty, quantity, reason, comment } = req.body;
        const qtyValue = qty || quantity;
        const reasonText = reason || comment || null;
        
        // Accept both warehouse_id and warehouse_to for IN operations (prefer warehouse_to)
        const effectiveWarehouseTo = warehouse_to || warehouse_id;

        // Validate required fields with proper type checking
        const productIdNum = Number(product_id);
        const warehouseToNum = Number(effectiveWarehouseTo);
        const qtyNum = Number(qtyValue);

        if (!product_id || isNaN(productIdNum) || productIdNum <= 0) {
            return error(res, "product_id обязателен и должен быть положительным числом", 400);
        }
        if (!effectiveWarehouseTo || isNaN(warehouseToNum) || warehouseToNum <= 0) {
            return error(res, "warehouse_id или warehouse_to обязателен и должен быть положительным числом", 400);
        }
        if (!qtyValue || isNaN(qtyNum) || qtyNum <= 0) {
            return error(res, "qty обязателен и должен быть положительным числом", 400);
        }

        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return error(res, "Требуется аутентификация", 401);
        }

        const result = await applyMovement({
            type: "IN",
            product_id: productIdNum,
            warehouse_to: warehouseToNum,
            qty: qtyNum,
            reason: reasonText,
            user_id: req.user.id,
        });

        // Get new quantity from stock after movement
        const stockRes = await pool.query(
            `SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2`,
            [productIdNum, warehouseToNum]
        );
        const new_quantity = stockRes.rows[0]?.quantity || 0;

        return success(res, {
            product_id: productIdNum,
            warehouse_id: warehouseToNum,
            new_quantity,
        }, 201);
    } catch (err) {
        // Handle validation errors with clear, human-readable messages
        if (
            err.message.includes("не найден") ||
            err.message.includes("обязателен") ||
            err.message.includes("должно быть") ||
            err.message.includes("положительным числом")
        ) {
            return error(res, err.message, 400);
        }
        if (err.message.includes("Недостаточно товара")) {
            return error(res, err.message, 409); // Conflict status for insufficient stock
        }
        // Log unexpected errors for debugging
        console.error("[movementIn] Unexpected error:", err);
        next(err);
    }
}

export async function movementOut(req, res, next) {
    try {
        const { product_id, warehouse_id, qty, quantity, reason } = req.body;
        const qtyValue = qty || quantity;

        if (!product_id || !warehouse_id || !qtyValue) {
            return error(
                res,
                "product_id, warehouse_id и qty обязательны",
                400
            );
        }

        const result = await applyMovement({
            type: "OUT",
            product_id,
            warehouse_from: warehouse_id,
            qty: qtyValue,
            reason,
            user_id: req.user?.id,
        });

        return success(res, result.movement, 201);
    } catch (err) {
        if (
            err.message.includes("не найден") ||
            err.message.includes("обязателен") ||
            err.message.includes("должно быть")
        ) {
            return error(res, err.message, 400);
        }
        if (err.message.includes("Недостаточно товара")) {
            return error(res, err.message, 400);
        }
        next(err);
    }
}

export async function movementTransfer(req, res, next) {
    try {
        const {
            product_id,
            from_warehouse_id,
            to_warehouse_id,
            qty,
            quantity,
            reason,
        } = req.body;
        const qtyValue = qty || quantity;

        if (!product_id || !from_warehouse_id || !to_warehouse_id || !qtyValue) {
            return error(
                res,
                "product_id, from_warehouse_id, to_warehouse_id и qty обязательны",
                400
            );
        }

        if (from_warehouse_id === to_warehouse_id) {
            return error(res, "Склад-источник и склад-назначение не могут совпадать", 400);
        }

        const result = await applyMovement({
            type: "TRANSFER",
            product_id,
            warehouse_from: from_warehouse_id,
            warehouse_to: to_warehouse_id,
            qty: qtyValue,
            reason,
            user_id: req.user?.id,
        });

        return success(res, result.movement, 201);
    } catch (err) {
        if (
            err.message.includes("не найден") ||
            err.message.includes("обязателен") ||
            err.message.includes("должно быть") ||
            err.message.includes("не могут совпадать")
        ) {
            return error(res, err.message, 400);
        }
        if (err.message.includes("Недостаточно товара")) {
            return error(res, err.message, 400);
        }
        next(err);
    }
}
