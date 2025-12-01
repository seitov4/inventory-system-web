// backend/src/controllers/movements.controller.js
import {
    createMovementIn,
    createMovementOut,
    getMovements as getMovementsService,
} from "../services/movements.service.js";

export async function getMovements(req, res, next) {
    try {
        const limit = Number(req.query.limit || 100);
        const offset = Number(req.query.offset || 0);
        const rows = await getMovementsService({ limit, offset });
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

export async function movementIn(req, res, next) {
    try {
        const { product_id, warehouse_id, quantity, reason } = req.body;
        if (!product_id || !warehouse_id || !quantity) {
            return res
                .status(400)
                .json({ message: "product_id, warehouse_id и quantity обязательны" });
        }

        const created = await createMovementIn({
            product_id,
            warehouse_id,
            quantity,
            reason,
            user_id: req.user?.id,
        });

        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
}

export async function movementOut(req, res, next) {
    try {
        const { product_id, warehouse_id, quantity, reason } = req.body;
        if (!product_id || !warehouse_id || !quantity) {
            return res
                .status(400)
                .json({ message: "product_id, warehouse_id и quantity обязательны" });
        }

        const created = await createMovementOut({
            product_id,
            warehouse_id,
            quantity,
            reason,
            user_id: req.user?.id,
        });

        res.status(201).json(created);
    } catch (err) {
        next(err);
    }
}
