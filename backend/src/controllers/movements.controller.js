import {
    applyMovement,
    getMovements as getMovementsService,
} from "../services/movements.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { success } from "../utils/response.js";
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
        return next(err);
    }
}

export async function movementIn(req, res, next) {
    try {
        const {
            product_id,
            warehouse_id,
            warehouse_to,
            qty,
            quantity,
            reason,
            comment,
        } = req.body;
        const qtyValue = qty || quantity;
        const reasonText = reason || comment || null;

        const effectiveWarehouseTo = warehouse_to || warehouse_id;

        const productIdNum = Number(product_id);
        const warehouseToNum = Number(effectiveWarehouseTo);
        const qtyNum = Number(qtyValue);

        if (!product_id || isNaN(productIdNum) || productIdNum <= 0) {
            return next(createAppError(ERROR_CODES.MOVEMENT_PRODUCT_ID_INVALID, 400));
        }
        if (!effectiveWarehouseTo || isNaN(warehouseToNum) || warehouseToNum <= 0) {
            return next(createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_TO_INVALID, 400));
        }
        if (!qtyValue || isNaN(qtyNum) || qtyNum <= 0) {
            return next(createAppError(ERROR_CODES.MOVEMENT_QTY_INVALID, 400));
        }

        if (!req.user || !req.user.id) {
            return next(createAppError(ERROR_CODES.AUTH_REQUIRED, 401));
        }

        await applyMovement({
            type: "IN",
            product_id: productIdNum,
            warehouse_to: warehouseToNum,
            qty: qtyNum,
            reason: reasonText,
            user_id: req.user.id,
        });

        const stockRes = await pool.query(
            `SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2`,
            [productIdNum, warehouseToNum]
        );
        const new_quantity = stockRes.rows[0]?.quantity || 0;

        return success(
            res,
            {
                product_id: productIdNum,
                warehouse_id: warehouseToNum,
                new_quantity,
            },
            201
        );
    } catch (err) {
        return next(err);
    }
}

export async function movementOut(req, res, next) {
    try {
        const { product_id, warehouse_id, qty, quantity, reason } = req.body;
        const qtyValue = qty || quantity;

        if (!product_id || !warehouse_id || !qtyValue) {
            return next(createAppError(ERROR_CODES.MOVEMENT_REQUIRED_FIELDS_OUT, 400));
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
        return next(err);
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
            return next(createAppError(ERROR_CODES.MOVEMENT_REQUIRED_FIELDS_TRANSFER, 400));
        }

        if (from_warehouse_id === to_warehouse_id) {
            return next(createAppError(ERROR_CODES.MOVEMENT_TRANSFER_SAME_WAREHOUSE, 400));
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
        return next(err);
    }
}

