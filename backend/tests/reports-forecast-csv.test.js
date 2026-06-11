import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/utils/db.js";
import { getSalesForecastCsv } from "../src/services/reports.service.js";
import { parseSalesForecastCsvQuery } from "../src/validation/reports.validation.js";

test("sales forecast csv parser defaults to realistic current month format", () => {
    const parsed = parseSalesForecastCsvQuery({});

    assert.equal(parsed.format, "realistic");
    assert.match(parsed.from, /^\d{4}-\d{2}-01$/);
    assert.match(parsed.to, /^\d{4}-\d{2}-\d{2}$/);
});

test("sales forecast csv service builds realistic continuous forecast csv", async () => {
    const originalQuery = pool.query;
    let capturedQuery = "";
    let capturedParams = [];

    try {
        pool.query = async (query, params) => {
            capturedQuery = query;
            capturedParams = params;
            return {
                rows: [
                    {
                        date: "2026-06-01",
                        store_id: "default-store",
                        sales: "102615.23",
                        quantity_sold: 24,
                        profit: "25487.22",
                        customer_traffic: 261,
                        has_promotion: 0,
                        is_holiday: 0,
                    },
                ],
            };
        };

        const result = await getSalesForecastCsv({
            storeId: 6,
            from: "2026-06-01",
            to: "2026-06-30",
            fromDate: new Date("2026-06-01T00:00:00.000Z"),
            toDate: new Date("2026-06-30T00:00:00.000Z"),
            format: "realistic",
        });

        assert.equal(capturedParams[0], 6);
        assert.match(capturedQuery, /generate_series/);
        assert.match(capturedQuery, /s\.store_id = \$1/);
        assert.match(capturedQuery, /LOWER\(s\.status\) = 'completed'/);
        assert.doesNotMatch(capturedQuery, /email|phone|password_hash|jwt|token/i);
        assert.equal(
            result.csv.split(/\r?\n/)[0],
            "date,store_id,sales,quantity_sold,profit,customer_traffic,has_promotion,is_holiday"
        );
        assert.match(result.csv, /2026-06-01,default-store,102615\.23,24,25487\.22,261,0,0/);
        assert.equal(result.filename, "sales_forecast_realistic_2026-06-01_to_2026-06-30.csv");
    } finally {
        pool.query = originalQuery;
    }
});

test("sales forecast csv service supports simple and extended headers", async () => {
    const originalQuery = pool.query;

    try {
        pool.query = async () => ({
            rows: [
                {
                    date: "2026-06-01",
                    store_id: "store_006",
                    sales: 0,
                    quantity_sold: 0,
                    profit: 0,
                    customer_traffic: 0,
                    has_promotion: 0,
                    is_holiday: 0,
                },
            ],
        });

        const baseInput = {
            storeId: 6,
            from: "2026-06-01",
            to: "2026-06-01",
            fromDate: new Date("2026-06-01T00:00:00.000Z"),
            toDate: new Date("2026-06-01T00:00:00.000Z"),
        };
        const simple = await getSalesForecastCsv({ ...baseInput, format: "simple" });
        const extended = await getSalesForecastCsv({ ...baseInput, format: "extended" });

        assert.equal(simple.csv.split(/\r?\n/)[0], "date,sales,store_id");
        assert.equal(
            extended.csv.split(/\r?\n/)[0],
            "date,store_id,sales,revenue,total,has_promotion,quantity_sold,profit,customer_traffic,is_holiday"
        );
    } finally {
        pool.query = originalQuery;
    }
});
