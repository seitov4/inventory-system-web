import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";
import movementsApi from "../../api/movementsApi";

// ===== STYLED COMPONENTS =====
const FormSection = styled.section`
    margin-bottom: 20px;
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 16px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
`;

const FormTitle = styled.h2`
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
`;

const ErrorText = styled.div`
    color: var(--error-color);
    margin-bottom: 8px;
    padding: 12px;
    background: var(--error-bg);
    border-radius: 8px;
    font-size: 14px;
`;

const SuccessText = styled.div`
    color: var(--success-color);
    margin-bottom: 8px;
    padding: 12px;
    background: var(--success-bg);
    border-radius: 8px;
    font-size: 13px;
`;

const Form = styled.form`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    align-items: flex-end;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FormField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const FormLabel = styled.label`
    display: block;
    font-size: 13px;
    margin-bottom: 4px;
    color: var(--text-secondary);
`;

const FormInput = styled.input`
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 14px;
    box-sizing: border-box;
    background: var(--bg-primary);
    color: var(--text-primary);

    &::placeholder {
        color: var(--text-tertiary);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &:disabled {
        background: var(--bg-tertiary);
        cursor: not-allowed;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 4px;
`;

const BtnPrimary = styled.button`
    padding: 9px 16px;
    border-radius: 8px;
    border: none;
    background: var(--primary-color);
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const BtnSecondary = styled.button`
    padding: 9px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;

    &:hover {
        background: var(--bg-tertiary);
        border-color: var(--text-tertiary);
    }
`;

// Table Section
const SectionWrapper = styled.section`
    margin-bottom: 24px;
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
`;

const SectionTitle = styled.h2`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
`;

const SearchInput = styled.input`
    width: 260px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 13px;
    background: var(--bg-primary);
    color: var(--text-primary);

    &::placeholder {
        color: var(--text-tertiary);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    @media (max-width: 640px) {
        width: 100%;
    }
`;

const FilterChipsRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
`;

const FilterChip = styled.button`
    border: none;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
    background: ${props => (props.$active ? "var(--primary-color)" : "var(--bg-tertiary)")};
    color: ${props => (props.$active ? "#ffffff" : "var(--text-secondary)")};
    font-weight: ${props => (props.$active ? 600 : 500)};

    &:hover {
        background: ${props => (props.$active ? "var(--primary-hover)" : "var(--bg-secondary)")};
    }
`;

const TableContainer = styled.div`
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    tbody tr {
        transition: background-color 0.2s;
        &:hover {
            background: var(--bg-tertiary);
        }
    }

    @media (max-width: 640px) {
        font-size: 12px;
        display: block;
        overflow-x: auto;
    }
`;

const TableHead = styled.thead`
    background: var(--bg-tertiary);
`;

const Th = styled.th`
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    color: var(--text-primary);

    @media (max-width: 640px) {
        padding: 8px 10px;
        white-space: nowrap;
    }
`;

const Td = styled.td`
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 14px;

    @media (max-width: 640px) {
        padding: 8px 10px;
        white-space: nowrap;
    }
`;

const TdActions = styled(Td)`
    white-space: nowrap;
`;

const LinkButton = styled.button`
    border: none;
    background: none;
    color: ${props => props.$danger ? 'var(--error-color)' : 'var(--primary-color)'};
    cursor: pointer;
    font-size: 13px;
    padding: 0;
    margin-right: 10px;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
`;

const EmptyState = styled.div`
    padding: 16px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 14px;
`;

// ===== MAIN COMPONENT =====
export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [stockRows, setStockRows] = useState([]);
    const [recentMovementProductIds, setRecentMovementProductIds] = useState([]);

    const [form, setForm] = useState({
        name: "",
        sku: "",
        barcode: "",
        purchase_price: "",
        sale_price: "",
        min_stock: "",
    });
    const [editingId, setEditingId] = useState(null);

    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [filter, setFilter] = useState("ALL"); // ALL | LOW_STOCK | NO_MOVEMENTS_30

    const [inlineEdit, setInlineEdit] = useState({
        id: null,
        field: null,
        value: "",
    });

    useEffect(() => {
        // Initialize search string from global search/notifications
        const fromSearch = sessionStorage.getItem("globalSearchQuery");
        const fromNotification = sessionStorage.getItem("lastNotificationProductId");
        if (fromSearch) {
            setQ(fromSearch);
            sessionStorage.removeItem("globalSearchQuery");
        } else if (fromNotification) {
            setQ(fromNotification);
            sessionStorage.removeItem("lastNotificationProductId");
        }
        loadAll();
    }, []);

    async function loadAll() {
        try {
            setLoading(true);
            setError("");
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [allProducts, left, recentMovements] = await Promise.all([
                productsApi.getAll().catch(() => []),
                productsApi.getProductsLeft().catch(() => []),
                movementsApi
                    .getMovements({
                        date_from: thirtyDaysAgo.toISOString(),
                        limit: 1000,
                    })
                    .catch(() => []),
            ]);
            setProducts(Array.isArray(allProducts) ? allProducts : []);
            setStockRows(Array.isArray(left) ? left : []);

            // remember which products had movements in the last 30 days
            if (Array.isArray(recentMovements)) {
                const ids = Array.from(
                    new Set(
                        recentMovements
                            .map((m) => m.product_id)
                            .filter((id) => typeof id === "number")
                    )
                );
                setRecentMovementProductIds(ids);
            } else {
                setRecentMovementProductIds([]);
            }
        } catch (e) {
            console.error(e);
            setError("Failed to load product data.");
        } finally {
            setLoading(false);
        }
    }

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

    const startInlineEdit = (product, field) => {
        if (field !== "sale_price" && field !== "min_stock") return;
        const currentValue =
            field === "sale_price"
                ? product.sale_price ?? ""
                : product.min_stock ?? "";
        setInlineEdit({
            id: product.id,
            field,
            value: currentValue === null ? "" : String(currentValue),
        });
    };

    const handleInlineChange = (e) => {
        setInlineEdit((prev) => ({ ...prev, value: e.target.value }));
    };

    const commitInlineEdit = async () => {
        if (!inlineEdit.id || !inlineEdit.field) return;

        const product = products.find((p) => p.id === inlineEdit.id);
        if (!product) {
            setInlineEdit({ id: null, field: null, value: "" });
            return;
        }

        const numeric = Number(inlineEdit.value);
        if (Number.isNaN(numeric) || numeric < 0) {
            alert("Value must be a non-negative number");
            return;
        }

        const payload = {
            name: product.name,
            sku: product.sku,
            category: product.category,
            barcode: product.barcode,
            purchase_price: product.purchase_price ?? 0,
            sale_price:
                inlineEdit.field === "sale_price"
                    ? numeric
                    : product.sale_price ?? 0,
            min_stock:
                inlineEdit.field === "min_stock"
                    ? numeric
                    : product.min_stock ?? 0,
        };

        try {
            setSaving(true);
            setError("");
            setMessage("");
            await productsApi.update(product.id, payload);
            setMessage("Product updated.");
            setInlineEdit({ id: null, field: null, value: "" });
            await loadAll();
        } catch (e) {
            console.error(e);
            setError("Failed to update product.");
        } finally {
            setSaving(false);
        }
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
        if (!window.confirm("Delete this product?")) return;
        try {
            setSaving(true);
            setError("");
            setMessage("");
            await productsApi.remove(id);
            setMessage("Product deleted.");
            await loadAll();
        } catch (e) {
            console.error(e);
            setError("Failed to delete product.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!form.name.trim()) {
            setError("Product name is required.");
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
                setMessage("Product updated.");
            } else {
                await productsApi.create(payload);
                setMessage("Product created.");
            }
            resetForm();
            await loadAll();
        } catch (e) {
            console.error(e);
            setError("Failed to save product.");
        } finally {
            setSaving(false);
        }
    };

    const productQuantityMap = useMemo(() => {
        const map = new Map();
        stockRows.forEach((row) => {
            const qty = row.quantity ?? row.qty ?? 0;
            map.set(row.id, qty);
        });
        return map;
    }, [stockRows]);

    const lowStockSet = useMemo(() => {
        const set = new Set();
        stockRows.forEach((row) => {
            const qty = row.quantity ?? row.qty ?? 0;
            const min = row.min_stock ?? 0;
            if (min > 0 && qty <= min) {
                set.add(row.id);
            }
        });
        return set;
    }, [stockRows]);

    const recentMovementSet = useMemo(
        () => new Set(recentMovementProductIds),
        [recentMovementProductIds]
    );

    const noMovementsCount = useMemo(() => {
        if (!products.length) return 0;
        if (!recentMovementProductIds.length) return 0;
        return products.filter((p) => !recentMovementSet.has(p.id)).length;
    }, [products, recentMovementProductIds, recentMovementSet]);

    const filteredProducts = useMemo(() => {
        const search = q.toLowerCase().trim();

        let list = products;
        if (search) {
            list = list.filter((p) =>
                ((p.name || "") + " " + (p.sku || "") + " " + (p.barcode || ""))
                    .toLowerCase()
                    .includes(search)
            );
        }

        if (filter === "LOW_STOCK") {
            list = list.filter((p) => lowStockSet.has(p.id));
        } else if (filter === "NO_MOVEMENTS_30") {
            if (recentMovementProductIds.length) {
                list = list.filter((p) => !recentMovementSet.has(p.id));
            }
        }

        return list;
    }, [q, products, filter, lowStockSet, recentMovementProductIds, recentMovementSet]);

    return (
        <Layout title="Products & stock">
            {/* Form CRUD */}
            <FormSection>
                <FormTitle>
                    {editingId ? "Edit product" : "Add product"}
                </FormTitle>

                {error && <ErrorText>{error}</ErrorText>}
                {message && <SuccessText>{message}</SuccessText>}

                <Form onSubmit={handleSubmit}>
                    <FormField>
                        <FormLabel>Name*</FormLabel>
                        <FormInput
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="For example, Milk 2.5%"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>SKU</FormLabel>
                        <FormInput
                            name="sku"
                            value={form.sku}
                            onChange={handleChange}
                            placeholder="SKU"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Barcode</FormLabel>
                        <FormInput
                            name="barcode"
                            value={form.barcode}
                            onChange={handleChange}
                            placeholder="Barcode"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Purchase price</FormLabel>
                        <FormInput
                            name="purchase_price"
                            type="number"
                            step="0.01"
                            value={form.purchase_price}
                            onChange={handleChange}
                            placeholder="0.00"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Sale price</FormLabel>
                        <FormInput
                            name="sale_price"
                            type="number"
                            step="0.01"
                            value={form.sale_price}
                            onChange={handleChange}
                            placeholder="0.00"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Min. stock</FormLabel>
                        <FormInput
                            name="min_stock"
                            type="number"
                            value={form.min_stock}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </FormField>

                    <ButtonGroup>
                        <BtnPrimary type="submit" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save"
                                    : "Add"}
                        </BtnPrimary>
                        {editingId && (
                            <BtnSecondary type="button" onClick={resetForm}>
                                Cancel
                            </BtnSecondary>
                        )}
                    </ButtonGroup>
                </Form>
            </FormSection>

            {/* Products Table */}
            <SectionWrapper>
                <SectionHeader>
                    <SectionTitle>Product catalog</SectionTitle>
                    <SearchInput
                        type="text"
                        placeholder="Search products..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </SectionHeader>
                <FilterChipsRow>
                    <FilterChip
                        type="button"
                        $active={filter === "ALL"}
                        onClick={() => setFilter("ALL")}
                    >
                        All
                    </FilterChip>
                    <FilterChip
                        type="button"
                        $active={filter === "LOW_STOCK"}
                        onClick={() => setFilter("LOW_STOCK")}
                    >
                        Low stock ({lowStockSet.size})
                    </FilterChip>
                    <FilterChip
                        type="button"
                        $active={filter === "NO_MOVEMENTS_30"}
                        onClick={() => setFilter("NO_MOVEMENTS_30")}
                    >
                        No movements 30 days
                        {noMovementsCount > 0 ? ` (${noMovementsCount})` : ""}
                    </FilterChip>
                </FilterChipsRow>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Name</Th>
                                <Th>SKU</Th>
                                <Th>Barcode</Th>
                                <Th>Purchase</Th>
                                <Th>Sale price</Th>
                                <Th>Min. stock</Th>
                                <Th>Actions</Th>
                            </tr>
                        </TableHead>
                        <tbody>
                            {filteredProducts.map((p) => (
                                <tr key={p.id} style={{ transition: 'background-color 0.2s' }}>
                                    <Td>{p.name}</Td>
                                    <Td>{p.sku}</Td>
                                    <Td>{p.barcode}</Td>
                                    <Td>{p.purchase_price ?? "—"}</Td>
                                    <Td
                                        onClick={() => startInlineEdit(p, "sale_price")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {inlineEdit.id === p.id && inlineEdit.field === "sale_price" ? (
                                            <FormInput
                                                as="input"
                                                type="number"
                                                step="0.01"
                                                value={inlineEdit.value}
                                                onChange={handleInlineChange}
                                                onBlur={commitInlineEdit}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        commitInlineEdit();
                                                    }
                                                    if (e.key === "Escape") {
                                                        setInlineEdit({
                                                            id: null,
                                                            field: null,
                                                            value: "",
                                                        });
                                                    }
                                                }}
                                                style={{ maxWidth: 100 }}
                                            />
                                        ) : (
                                            p.sale_price ?? "—"
                                        )}
                                    </Td>
                                    <Td
                                        onClick={() => startInlineEdit(p, "min_stock")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {inlineEdit.id === p.id && inlineEdit.field === "min_stock" ? (
                                            <FormInput
                                                as="input"
                                                type="number"
                                                value={inlineEdit.value}
                                                onChange={handleInlineChange}
                                                onBlur={commitInlineEdit}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        commitInlineEdit();
                                                    }
                                                    if (e.key === "Escape") {
                                                        setInlineEdit({
                                                            id: null,
                                                            field: null,
                                                            value: "",
                                                        });
                                                    }
                                                }}
                                                style={{ maxWidth: 80 }}
                                            />
                                        ) : (
                                            <>
                                                {p.min_stock ?? 0}
                                                {(() => {
                                                    const qty =
                                                        productQuantityMap.get(p.id) ?? 0;
                                                    const min = p.min_stock ?? 0;
                                                    const isLow =
                                                        min > 0 && qty <= min;
                                                    if (!isLow) return null;
                                                    return (
                                                        <span
                                                            style={{
                                                                marginLeft: 6,
                                                                padding: "2px 6px",
                                                                borderRadius: 999,
                                                                fontSize: 11,
                                                                fontWeight: 600,
                                                                background:
                                                                    "var(--error-bg)",
                                                                color: "var(--error-color)",
                                                            }}
                                                        >
                                                            LOW
                                                        </span>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </Td>
                                    <TdActions>
                                        <LinkButton type="button" onClick={() => handleEdit(p)}>
                                            Edit
                                        </LinkButton>
                                        <LinkButton type="button" $danger onClick={() => handleDelete(p.id)}>
                                            Delete
                                        </LinkButton>
                                    </TdActions>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {filteredProducts.length === 0 && !loading && (
                        <EmptyState>No products found</EmptyState>
                    )}
                </TableContainer>
            </SectionWrapper>

            {/* Stock Table */}
            <SectionWrapper>
                <SectionTitle style={{ marginBottom: 10 }}>
                    Stock by warehouse (data from /products/left)
                </SectionTitle>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Warehouse / store</Th>
                                <Th>Product</Th>
                                <Th>SKU</Th>
                                <Th>Quantity</Th>
                            </tr>
                        </TableHead>
                        <tbody>
                            {stockRows.map((r, i) => (
                                <tr key={i}>
                                    <Td>{r.warehouse_name || r.store_name || "—"}</Td>
                                    <Td>{r.name}</Td>
                                    <Td>{r.sku}</Td>
                                    <Td>{r.quantity ?? r.qty ?? 0}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {stockRows.length === 0 && (
                        <EmptyState>No stock data available</EmptyState>
                    )}
                </TableContainer>
            </SectionWrapper>
        </Layout>
    );
}

