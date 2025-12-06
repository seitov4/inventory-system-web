import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";
import "./products.css";

export default function ProductsPage() {
    // Список номенклатуры (чистые товары)
    const [products, setProducts] = useState([]);
    // Остатки (products/left)
    const [stockRows, setStockRows] = useState([]);

    // Форма
    const [form, setForm] = useState({
        name: "",
        sku: "",
        barcode: "",
        purchase_price: "",
        sale_price: "",
        min_stock: "",
    });
    const [editingId, setEditingId] = useState(null);

    const [q, setQ] = useState(""); // поиск по номенклатуре
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Загрузка данных
    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        try {
            setLoading(true);
            setError("");
            const [allProducts, left] = await Promise.all([
                productsApi.getAll().catch(() => []),
                productsApi.getProductsLeft().catch(() => []),
            ]);
            setProducts(Array.isArray(allProducts) ? allProducts : []);
            setStockRows(Array.isArray(left) ? left : []);
        } catch (e) {
            console.error(e);
            setError("Не удалось загрузить данные по товарам.");
        } finally {
            setLoading(false);
        }
    }

    // Обработчики формы
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setForm({
            name: "",
            sku: "",
            barcode: "",
            purchase_price: "",
            sale_price: "",
            min_stock: "",
        });
        setEditingId(null);
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setForm({
            name: product.name || "",
            sku: product.sku || "",
            barcode: product.barcode || "",
            purchase_price: product.purchase_price ?? "",
            sale_price: product.sale_price ?? "",
            min_stock: product.min_stock ?? "",
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить этот товар?")) return;
        try {
            setSaving(true);
            setError("");
            setMessage("");
            await productsApi.remove(id);
            setMessage("Товар удалён.");
            await loadAll();
        } catch (e) {
            console.error(e);
            setError("Не удалось удалить товар.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!form.name.trim()) {
            setError("Название товара обязательно.");
            return;
        }

        const payload = {
            name: form.name.trim(),
            sku: form.sku.trim() || null,
            barcode: form.barcode.trim() || null,
            purchase_price: form.purchase_price
                ? Number(form.purchase_price)
                : null,
            sale_price: form.sale_price ? Number(form.sale_price) : null,
            min_stock: form.min_stock ? Number(form.min_stock) : 0,
        };

        try {
            setSaving(true);
            if (editingId) {
                await productsApi.update(editingId, payload);
                setMessage("Товар обновлён.");
            } else {
                await productsApi.create(payload);
                setMessage("Товар добавлен.");
            }
            resetForm();
            await loadAll();
        } catch (e) {
            console.error(e);
            setError("Не удалось сохранить товар.");
        } finally {
            setSaving(false);
        }
    };

    // Фильтр по номенклатуре
    const filteredProducts = useMemo(() => {
        const s = q.toLowerCase().trim();
        if (!s) return products;
        return products.filter((p) =>
            ((p.name || "") + " " + (p.sku || "") + " " + (p.barcode || ""))
                .toLowerCase()
                .includes(s)
        );
    }, [q, products]);

    return (
        <Layout title="Товары и остатки">
            {/* Форма CRUD */}
            <section
                style={{
                    marginBottom: 20,
                    background: "#fff",
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
                    border: "1px solid rgba(148,163,184,0.25)",
                }}
            >
                <h2
                    style={{
                        margin: "0 0 12px",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#0f172a",
                    }}
                >
                    {editingId ? "Редактирование товара" : "Добавление товара"}
                </h2>

                {error && (
                    <div style={{ color: "#b91c1c", marginBottom: 8 }}>
                        {error}
                    </div>
                )}
                {message && (
                    <div
                        style={{
                            color: "#15803d",
                            marginBottom: 8,
                            fontSize: 13,
                        }}
                    >
                        {message}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                        alignItems: "flex-end",
                    }}
                >
                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#475569",
                            }}
                        >
                            Название*
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Например, Молоко 2.5%"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#475569",
                            }}
                        >
                            SKU
                        </label>
                        <input
                            name="sku"
                            value={form.sku}
                            onChange={handleChange}
                            placeholder="Артикул"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#475569",
                            }}
                        >
                            Штрих-код
                        </label>
                        <input
                            name="barcode"
                            value={form.barcode}
                            onChange={handleChange}
                            placeholder="Штрих-код"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#475569",
                            }}
                        >
                            Закупочная цена
                        </label>
                        <input
                            name="purchase_price"
                            type="number"
                            step="0.01"
                            value={form.purchase_price}
                            onChange={handleChange}
                            placeholder="0.00"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#475569",
                            }}
                        >
                            Цена продажи
                        </label>
                        <input
                            name="sale_price"
                            type="number"
                            step="0.01"
                            value={form.sale_price}
                            onChange={handleChange}
                            placeholder="0.00"
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label
                            style={{
                                display: "block",
                                fontSize: 13,
                                marginBottom: 4,
                                color: "#475569",
                            }}
                        >
                            Мин. остаток
                        </label>
                        <input
                            name="min_stock"
                            type="number"
                            value={form.min_stock}
                            onChange={handleChange}
                            placeholder="0"
                            style={inputStyle}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 4,
                        }}
                    >
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "9px 16px",
                                borderRadius: 999,
                                border: "none",
                                background: "#0ea5e9",
                                color: "#0f172a",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                            }}
                        >
                            {saving
                                ? "Сохранение..."
                                : editingId
                                    ? "Сохранить"
                                    : "Добавить"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{
                                    padding: "9px 14px",
                                    borderRadius: 999,
                                    border: "1px solid #cbd5e1",
                                    background: "#fff",
                                    color: "#475569",
                                    fontSize: 13,
                                    cursor: "pointer",
                                }}
                            >
                                Отмена
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* Номенклатура (CRUD-таблица) */}
            <section style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#0f172a",
                        }}
                    >
                        Номенклатура товаров
                    </h2>
                    <input
                        type="text"
                        placeholder="Поиск по товарам..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{
                            width: 260,
                            padding: "8px 10px",
                            borderRadius: 999,
                            border: "1px solid #cbd5e1",
                            fontSize: 13,
                        }}
                    />
                </div>

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
                            <th style={thStyle}>Название</th>
                            <th style={thStyle}>SKU</th>
                            <th style={thStyle}>Штрих-код</th>
                            <th style={thStyle}>Закупочная</th>
                            <th style={thStyle}>Цена продажи</th>
                            <th style={thStyle}>Мин. остаток</th>
                            <th style={thStyle}>Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredProducts.map((p) => (
                            <tr key={p.id}>
                                <td style={tdStyle}>{p.name}</td>
                                <td style={tdStyle}>{p.sku}</td>
                                <td style={tdStyle}>{p.barcode}</td>
                                <td style={tdStyle}>
                                    {p.purchase_price ?? "—"}
                                </td>
                                <td style={tdStyle}>
                                    {p.sale_price ?? "—"}
                                </td>
                                <td style={tdStyle}>
                                    {p.min_stock ?? 0}
                                </td>
                                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(p)}
                                        style={linkBtnStyle}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(p.id)}
                                        style={{
                                            ...linkBtnStyle,
                                            color: "#b91c1c",
                                        }}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && !loading && (
                        <div
                            style={{
                                padding: 16,
                                textAlign: "center",
                                color: "#64748b",
                                fontSize: 14,
                            }}
                        >
                            Товары не найдены
                        </div>
                    )}
                </div>
            </section>

            {/* Остатки по складам */}
            <section>
                <h2
                    style={{
                        margin: "0 0 10px",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#0f172a",
                    }}
                >
                    Остатки по складам (данные /products/left)
                </h2>

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
                        {stockRows.map((r, i) => (
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

                    {stockRows.length === 0 && (
                        <div
                            style={{
                                padding: 16,
                                textAlign: "center",
                                color: "#64748b",
                                fontSize: 14,
                            }}
                        >
                            Данные по остаткам отсутствуют
                        </div>
                    )}
                </div>
            </section>
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

const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
};

const linkBtnStyle = {
    border: "none",
    background: "none",
    color: "#0ea5e9",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    marginRight: 10,
};
