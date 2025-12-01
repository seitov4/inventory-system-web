// backend/src/controllers/sales.controller.js
import {
    createSale as createSaleService,
    getSaleById as getSaleByIdService,
    returnSale as returnSaleService,
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getSalesChart,
} from "../services/sales.service.js";

export async function createSale(req, res, next) {
    try {
        const cashier_id = req.user?.id;
        const { store_id, warehouse_id, items, discount, payment_type } =
            req.body;

        const sale = await createSaleService({
            cashier_id,
            store_id,
            warehouse_id,
            items,
            discount,
            payment_type,
        });

        res.status(201).json(sale);
    } catch (err) {
        next(err);
    }
}

export async function getSaleById(req, res, next) {
    try {
        const { id } = req.params;
        const sale = await getSaleByIdService(id);
        if (!sale) return res.status(404).json({ message: "Продажа не найдена" });
        res.json(sale);
    } catch (err) {
        next(err);
    }
}

export async function createSaleReturn(req, res, next) {
    try {
        const { id } = req.params;
        const { warehouse_id } = req.body;
        await returnSaleService({
            sale_id: id,
            user_id: req.user?.id,
            warehouse_id,
        });
        res.json({ message: "Возврат выполнен" });
    } catch (err) {
        next(err);
    }
}

export async function getDailySalesController(req, res, next) {
    try {
        const data = await getDailySales();
        res.json(data);
    } catch (err) {
        next(err);
    }
}

export async function getWeeklySalesController(req, res, next) {
    try {
        const data = await getWeeklySales();
        res.json(data);
    } catch (err) {
        next(err);
    }
}

export async function getMonthlySalesController(req, res, next) {
    try {
        const data = await getMonthlySales();
        res.json(data);
    } catch (err) {
        next(err);
    }
}

export async function getSalesChartController(req, res, next) {
    try {
        const data = await getSalesChart();
        res.json(data);
    } catch (err) {
        next(err);
    }
}
