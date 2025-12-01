import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";

export default function WarehousePage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");
                const data = await productsApi.getProductsLeft();
                setRows(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setError("Не удалось загрузить данные склада.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <Layout title="Склад и остатки по магазинам">
            {loading && <div>Загрузка...</div>}
            {error && (
                <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
            )}

            {!loading && (
                <div
                    style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
                        background: "#fff",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: 14,
                        }}
                    >
                        <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th style={thStyle}>Склад / магазин</th>
                            <th style={thStyle}>Товар</th>
                            <th style={thStyle}>SKU</th>
                            <th style={thStyle}>Остаток</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r, i) => (
                            <tr key={i}>
                                <td style={tdStyle}>
                                    {r.warehouse_name ||
                                        r.store_name ||
                                        "—"}
                                </td>
                                <td style={tdStyle}>{r.name}</td>
                                <td style={tdStyle}>{r.sku}</td>
                                <td style={tdStyle}>
                                    {r.quantity ?? r.qty ?? 0}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {rows.length === 0 && (
                        <div
                            style={{
                                padding: 18,
                                textAlign: "center",
                                color: "#64748b",
                            }}
                        >
                            Данные склада отсутствуют
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
}

const thStyle = {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: 600,
    color: "#475569",
};

const tdStyle = {
    padding: "8px 12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#0f172a",
    fontSize: 14,
};
