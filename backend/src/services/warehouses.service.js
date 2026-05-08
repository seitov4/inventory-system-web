import pool from "../utils/db.js";

export async function getWarehouses() {
    const result = await pool.query(
        `SELECT w.id,
                w.name,
                w.type,
                w.store_id,
                s.name AS store_name,
                CAST(COALESCE(SUM(st.quantity), 0) AS INTEGER) AS total_quantity
         FROM warehouses w
         LEFT JOIN stores s ON s.id = w.store_id
         LEFT JOIN stock st ON st.warehouse_id = w.id
         GROUP BY w.id, s.name
         ORDER BY w.id`
    );

    return result.rows;
}
