import { getWarehouses } from "../services/warehouses.service.js";
import { success } from "../utils/response.js";

export async function listWarehouses(req, res, next) {
    try {
        const warehouses = await getWarehouses();
        return success(res, warehouses);
    } catch (err) {
        return next(err);
    }
}
