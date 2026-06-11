import pool from "../utils/db.js";
import { REPORTS_OPERATION_TYPES } from "../validation/reports.validation.js";

function toIsoDateString(value) {
    return new Date(value).toISOString().slice(0, 10);
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : fallback;
}

function formatCsvNumber(value) {
    return toNumber(value).toFixed(2);
}

function escapeCsvValue(value) {
    const stringValue = String(value ?? "");

    if (/[",\r\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

function buildCsv(headers, rows) {
    return [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ].join("\r\n");
}

function mapReportRow(row) {
    return {
        id: toInteger(row.id),
        date: row.date,
        product_id: toInteger(row.product_id),
        product_name: row.product_name,
        category: row.category || null,
        quantity: toInteger(row.quantity),
        unit_price: toNumber(row.unit_price),
        total_amount: toNumber(row.total_amount),
        employee_id: row.employee_id === null ? null : toInteger(row.employee_id),
        employee_name: row.employee_name || null,
        employee_role: row.employee_role || null,
        operation_type: row.operation_type,
        source: row.source,
    };
}

function buildEmployeeNameSql(alias) {
    return `COALESCE(
        NULLIF(BTRIM(${alias}.name), ''),
        NULLIF(BTRIM(CONCAT(COALESCE(${alias}.first_name, ''), ' ', COALESCE(${alias}.last_name, ''))), ''),
        NULLIF(BTRIM(${alias}.email), ''),
        NULLIF(BTRIM(${alias}.phone), '')
    )`;
}

function buildTransactionsCte(storeId, filters) {
    const params = [storeId, filters.fromDateTime, filters.toDateTime];
    const saleConditions = [
        "s.store_id = $1",
        "s.created_at >= $2",
        "s.created_at <= $3",
        "LOWER(s.status) = 'completed'",
    ];
    const returnConditions = [
        "m.store_id = $1",
        "m.created_at >= $2",
        "m.created_at <= $3",
        "UPPER(COALESCE(m.source_type, m.type)) = 'RETURN'",
    ];

    if (filters.product_id) {
        params.push(filters.product_id);
        saleConditions.push(`p.id = $${params.length}`);
        returnConditions.push(`p.id = $${params.length}`);
    }

    if (filters.category) {
        params.push(filters.category);
        saleConditions.push(`p.category = $${params.length}`);
        returnConditions.push(`p.category = $${params.length}`);
    }

    if (filters.employee_id) {
        params.push(filters.employee_id);
        saleConditions.push(`s.cashier_id = $${params.length}`);
        returnConditions.push(`m.created_by = $${params.length}`);
    }

    const employeeNameFromSales = buildEmployeeNameSql("u");
    const employeeNameFromReturns = buildEmployeeNameSql("u");

    const cte = `
        WITH sale_rows AS (
            SELECT
                si.id AS id,
                s.created_at AS date,
                p.id AS product_id,
                p.name AS product_name,
                p.category,
                si.qty AS quantity,
                si.price AS unit_price,
                GREATEST((si.qty * si.price) - COALESCE(si.discount, 0), 0) AS total_amount,
                s.cashier_id AS employee_id,
                ${employeeNameFromSales} AS employee_name,
                u.role AS employee_role,
                'SALE' AS operation_type,
                'sales' AS source
            FROM sales s
            JOIN sale_items si ON si.sale_id = s.id
            JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
            LEFT JOIN users u ON u.id = s.cashier_id AND u.store_id = s.store_id
            WHERE ${saleConditions.join("\n              AND ")}
        ),
        return_rows AS (
            SELECT
                m.id AS id,
                m.created_at AS date,
                p.id AS product_id,
                p.name AS product_name,
                p.category,
                m.qty AS quantity,
                COALESCE(return_item.price, p.sale_price, 0) AS unit_price,
                GREATEST(
                    (m.qty * COALESCE(return_item.price, p.sale_price, 0))
                        - COALESCE(return_item.discount, 0),
                    0
                ) AS total_amount,
                m.created_by AS employee_id,
                ${employeeNameFromReturns} AS employee_name,
                u.role AS employee_role,
                'RETURN' AS operation_type,
                'movements' AS source
            FROM movements m
            JOIN products p ON p.id = m.product_id AND p.store_id = m.store_id
            LEFT JOIN users u ON u.id = m.created_by AND u.store_id = m.store_id
            LEFT JOIN LATERAL (
                SELECT si.price, si.discount
                FROM sale_items si
                JOIN sales s ON s.id = si.sale_id AND s.store_id = m.store_id
                WHERE si.sale_id = m.related_entity_id
                  AND si.product_id = m.product_id
                ORDER BY si.id
                LIMIT 1
            ) AS return_item ON TRUE
            WHERE ${returnConditions.join("\n              AND ")}
        ),
        combined AS (
            SELECT * FROM sale_rows
            UNION ALL
            SELECT * FROM return_rows
        )
    `;

    let combinedWhere = "";
    if (filters.operation_type) {
        params.push(filters.operation_type);
        combinedWhere = `WHERE operation_type = $${params.length}`;
    }

    return { cte, params, combinedWhere };
}

function buildRevenueQuery(storeId, filters) {
    const params = [storeId, filters.fromDateTime, filters.toDateTime];
    const conditions = [
        "s.store_id = $1",
        "s.created_at >= $2",
        "s.created_at <= $3",
        "LOWER(s.status) = 'completed'",
    ];

    if (filters.product_id) {
        params.push(filters.product_id);
        conditions.push(`p.id = $${params.length}`);
    }

    if (filters.category) {
        params.push(filters.category);
        conditions.push(`p.category = $${params.length}`);
    }

    if (filters.employee_id) {
        params.push(filters.employee_id);
        conditions.push(`s.cashier_id = $${params.length}`);
    }

    const query = `
        SELECT
            DATE(s.created_at) AS date,
            COALESCE(SUM((si.qty * si.price) - COALESCE(si.discount, 0)), 0) AS revenue,
            COUNT(DISTINCT s.id)::int AS orders_count,
            COALESCE(SUM(si.qty), 0)::int AS items_sold
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
        WHERE ${conditions.join("\n          AND ")}
        GROUP BY DATE(s.created_at)
        ORDER BY DATE(s.created_at) ASC
    `;

    return { query, params };
}

/**
 * Get sales report data for a date range.
 * Existing web export endpoint uses this and expects completed sales only.
 */
export async function getSalesReportData(storeId, fromDate, toDate) {
    const toDateEnd = new Date(toDate);
    toDateEnd.setHours(23, 59, 59, 999);

    const query = `
        SELECT
            s.created_at AS date,
            s.id AS sale_id,
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            si.qty AS quantity,
            si.price AS sale_price,
            (si.qty * si.price) AS total
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
        WHERE s.store_id = $1
          AND s.created_at >= $2
          AND s.created_at <= $3
          AND LOWER(s.status) = 'completed'
        ORDER BY s.created_at DESC, s.id, si.id
    `;

    const result = await pool.query(query, [storeId, fromDate, toDateEnd]);

    return result.rows.map((row) => ({
        date: row.date,
        sale_id: row.sale_id,
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku || "",
        quantity: toInteger(row.quantity),
        sale_price: toNumber(row.sale_price),
        total: toNumber(row.total),
    }));
}

export async function getSalesForecastCsv({ storeId, from, to, fromDate, toDate, format }) {
    const query = `
        WITH date_series AS (
            SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS date
        ),
        store_info AS (
            SELECT COALESCE(NULLIF(BTRIM(slug), ''), CONCAT('store_', LPAD(id::text, 3, '0'))) AS export_store_id
            FROM stores
            WHERE id = $1
        ),
        daily_sales AS (
            SELECT
                DATE(s.created_at) AS date,
                COALESCE(SUM(s.total_amount), 0) AS sales,
                COUNT(DISTINCT s.id)::int AS orders_count
            FROM sales s
            WHERE s.store_id = $1
              AND LOWER(s.status) = 'completed'
              AND DATE(s.created_at) >= $2::date
              AND DATE(s.created_at) <= $3::date
            GROUP BY DATE(s.created_at)
        ),
        daily_items AS (
            SELECT
                DATE(s.created_at) AS date,
                COALESCE(SUM(si.qty), 0)::int AS quantity_sold,
                COALESCE(SUM(
                    CASE
                        WHEN p.purchase_price IS NOT NULL
                            THEN (si.price - p.purchase_price) * si.qty
                        ELSE GREATEST((si.price * si.qty) - COALESCE(si.discount, 0), 0) * 0.25
                    END
                ), 0) AS item_profit
            FROM sales s
            JOIN sale_items si ON si.sale_id = s.id
            LEFT JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
            WHERE s.store_id = $1
              AND LOWER(s.status) = 'completed'
              AND DATE(s.created_at) >= $2::date
              AND DATE(s.created_at) <= $3::date
            GROUP BY DATE(s.created_at)
        )
        SELECT
            ds.date,
            COALESCE(si.export_store_id, CONCAT('store_', LPAD($1::text, 3, '0'))) AS store_id,
            COALESCE(s.sales, 0) AS sales,
            COALESCE(i.quantity_sold, 0)::int AS quantity_sold,
            CASE
                WHEN COALESCE(i.quantity_sold, 0) > 0 THEN COALESCE(i.item_profit, 0)
                ELSE COALESCE(s.sales, 0) * 0.25
            END AS profit,
            GREATEST(COALESCE(s.orders_count, 0) * 5, COALESCE(i.quantity_sold, 0) * 3)::int AS customer_traffic,
            0::int AS has_promotion,
            0::int AS is_holiday
        FROM date_series ds
        CROSS JOIN store_info si
        LEFT JOIN daily_sales s ON s.date = ds.date
        LEFT JOIN daily_items i ON i.date = ds.date
        ORDER BY ds.date ASC
    `;

    const result = await pool.query(query, [storeId, fromDate, toDate]);

    const baseRows = result.rows.map((row) => {
        const sales = toNumber(row.sales);
        return {
            date: toIsoDateString(row.date),
            store_id: row.store_id,
            sales: formatCsvNumber(sales),
            quantity_sold: toInteger(row.quantity_sold),
            profit: formatCsvNumber(row.profit),
            customer_traffic: toInteger(row.customer_traffic),
            has_promotion: toInteger(row.has_promotion),
            is_holiday: toInteger(row.is_holiday),
            revenue: formatCsvNumber(sales),
            total: formatCsvNumber(sales),
        };
    });

    const headersByFormat = {
        simple: ["date", "sales", "store_id"],
        realistic: [
            "date",
            "store_id",
            "sales",
            "quantity_sold",
            "profit",
            "customer_traffic",
            "has_promotion",
            "is_holiday",
        ],
        extended: [
            "date",
            "store_id",
            "sales",
            "revenue",
            "total",
            "has_promotion",
            "quantity_sold",
            "profit",
            "customer_traffic",
            "is_holiday",
        ],
    };
    const headers = headersByFormat[format] || headersByFormat.realistic;

    return {
        filename: `sales_forecast_${format}_${from}_to_${to}.csv`,
        csv: `${buildCsv(headers, baseRows)}\r\n`,
        rowCount: baseRows.length,
    };
}

export async function getReportTransactions(storeId, filters) {
    const { cte, params, combinedWhere } = buildTransactionsCte(storeId, filters);
    const countQuery = `${cte}
        SELECT COUNT(*)::int AS total
        FROM combined
        ${combinedWhere}
    `;

    const countResult = await pool.query(countQuery, params);
    const total = toInteger(countResult.rows[0]?.total, 0);

    const dataParams = [...params, filters.limit, filters.offset];
    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const dataQuery = `${cte}
        SELECT *
        FROM combined
        ${combinedWhere}
        ORDER BY date DESC, id DESC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);

    return {
        filters: {
            from: filters.from,
            to: filters.to,
            product_id: filters.product_id,
            category: filters.category,
            employee_id: filters.employee_id,
            operation_type: filters.operation_type,
        },
        pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total,
        },
        transactions: dataResult.rows.map(mapReportRow),
    };
}

export async function getRevenueDailyReport(storeId, filters) {
    if (filters.operation_type && filters.operation_type !== "SALE") {
        return {
            period: {
                from: filters.from,
                to: filters.to,
            },
            series: [],
            summary: {
                total_revenue: 0,
                orders_count: 0,
                items_sold: 0,
                average_order_value: 0,
            },
        };
    }

    const { query, params } = buildRevenueQuery(storeId, filters);
    const result = await pool.query(query, params);

    const series = result.rows.map((row) => ({
        date: toIsoDateString(row.date),
        revenue: toNumber(row.revenue),
        orders_count: toInteger(row.orders_count),
        items_sold: toInteger(row.items_sold),
    }));

    const summary = series.reduce(
        (acc, row) => {
            acc.total_revenue += row.revenue;
            acc.orders_count += row.orders_count;
            acc.items_sold += row.items_sold;
            return acc;
        },
        {
            total_revenue: 0,
            orders_count: 0,
            items_sold: 0,
        }
    );

    return {
        period: {
            from: filters.from,
            to: filters.to,
        },
        series,
        summary: {
            ...summary,
            average_order_value: summary.orders_count
                ? Number((summary.total_revenue / summary.orders_count).toFixed(2))
                : 0,
        },
    };
}

export async function getReportFilters(storeId) {
    const [productsResult, categoriesResult, employeesResult] = await Promise.all([
        pool.query(
            `SELECT id, name, sku, category
             FROM products
             WHERE store_id = $1
               AND is_active IS TRUE
             ORDER BY name ASC`,
            [storeId]
        ),
        pool.query(
            `SELECT DISTINCT category
             FROM products
             WHERE store_id = $1
               AND is_active IS TRUE
               AND category IS NOT NULL
               AND BTRIM(category) <> ''
             ORDER BY category ASC`,
            [storeId]
        ),
        pool.query(
            `SELECT
                id,
                ${buildEmployeeNameSql("u")} AS name,
                email,
                role,
                is_active
             FROM users u
             WHERE store_id = $1
             ORDER BY is_active DESC, role ASC, id ASC`,
            [storeId]
        ),
    ]);

    const operationTypes = REPORTS_OPERATION_TYPES.map((value) => ({
        value,
        label: value === "WRITE_OFF" ? "Write-off" : value === "RETURN" ? "Return" : "Sale",
        supported: value !== "WRITE_OFF",
    }));

    return {
        products: productsResult.rows.map((row) => ({
            id: toInteger(row.id),
            name: row.name,
            sku: row.sku || null,
            category: row.category || null,
        })),
        categories: categoriesResult.rows.map((row) => row.category),
        employees: employeesResult.rows.map((row) => ({
            id: toInteger(row.id),
            name: row.name || row.email || `User #${row.id}`,
            email: row.email || null,
            role: row.role,
            is_active: row.is_active !== false,
        })),
        operationTypes,
    };
}
