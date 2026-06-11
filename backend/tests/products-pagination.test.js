import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/utils/db.js";
import { getPaginatedProducts, lookupProducts } from "../src/services/products.service.js";

test("paginated products returns page metadata, counts, and scoped rows", async () => {
    const originalQuery = pool.query;
    const calls = [];

    pool.query = async (sql, params) => {
        calls.push({ sql, params });

        if (calls.length === 1) {
            return {
                rows: [
                    {
                        all_count: 90,
                        low_stock_count: 17,
                        no_movements_30_count: 8,
                    },
                ],
            };
        }

        if (calls.length === 2) {
            return { rows: [{ total: 42 }] };
        }

        return {
            rows: [
                {
                    id: 12,
                    store_id: 5,
                    name: "Milk 1L",
                    sku: "MILK-1",
                    barcode: "123",
                    quantity: 4,
                    min_stock: 10,
                    is_low_stock: true,
                    has_recent_movement: false,
                },
            ],
        };
    };

    try {
        const result = await getPaginatedProducts(5, {
            page: 2,
            limit: 30,
            search: "Milk",
            filter: "low_stock",
        });

        assert.equal(result.products.length, 1);
        assert.deepEqual(result.pagination, {
            page: 2,
            limit: 30,
            total: 42,
            total_pages: 2,
            has_next: false,
            has_prev: true,
        });
        assert.deepEqual(result.counts, {
            all: 90,
            low_stock: 17,
            no_movements_30: 8,
        });

        assert.equal(calls.length, 3);
        assert.deepEqual(calls[2].params, [5, "%Milk%", 30, 30]);
        assert.match(calls[2].sql, /WHERE min_stock > 0 AND quantity <= min_stock/);
        assert.match(calls[2].sql, /p\.store_id = \$1/);
        assert.match(calls[2].sql, /LIMIT \$3 OFFSET \$4/);
    } finally {
        pool.query = originalQuery;
    }
});

test("product lookup searches within current store and returns stock", async () => {
    const originalQuery = pool.query;
    const calls = [];

    pool.query = async (sql, params) => {
        calls.push({ sql, params });
        return {
            rows: [
                {
                    id: 12,
                    name: "ClearSpring Bread 1 pack",
                    sku: "DEMO-00162",
                    barcode: "4870000000162",
                    sale_price: "513.30",
                    stock: 12,
                },
            ],
        };
    };

    try {
        const result = await lookupProducts(5, "4870000000162", 10);

        assert.equal(result.length, 1);
        assert.equal(result[0].stock, 12);
        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0].params, [
            5,
            "4870000000162",
            "%4870000000162%",
            "4870000000162",
            10,
        ]);
        assert.match(calls[0].sql, /p\.store_id = \$1/);
        assert.match(calls[0].sql, /p\.barcode = \$2/);
        assert.match(calls[0].sql, /p\.sku = \$2/);
    } finally {
        pool.query = originalQuery;
    }
});
