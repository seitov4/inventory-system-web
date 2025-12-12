import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";

// ===== STYLED COMPONENTS =====
const FormSection = styled.section`
    margin-bottom: 20px;
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.25);
`;

const FormTitle = styled.h2`
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
`;

const ErrorText = styled.div`
    color: #b91c1c;
    margin-bottom: 8px;
    font-size: 14px;
`;

const SuccessText = styled.div`
    color: #15803d;
    margin-bottom: 8px;
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
    color: #475569;
`;

const FormInput = styled.input`
    width: 100%;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 14px;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 4px;
`;

const BtnPrimary = styled.button`
    padding: 9px 16px;
    border-radius: 999px;
    border: none;
    background: #0ea5e9;
    color: #0f172a;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: 0.2s ease;

    &:hover:not(:disabled) {
        background: #0284c7;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const BtnSecondary = styled.button`
    padding: 9px 14px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #475569;
    font-size: 13px;
    cursor: pointer;
    transition: 0.2s ease;

    &:hover {
        background: #f8fafc;
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
    color: #0f172a;
`;

const SearchInput = styled.input`
    width: 260px;
    padding: 8px 10px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    font-size: 13px;

    &:focus {
        outline: none;
        border-color: #0ea5e9;
    }

    @media (max-width: 640px) {
        width: 100%;
    }
`;

const TableContainer = styled.div`
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
    background: #fff;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    @media (max-width: 640px) {
        font-size: 12px;
        display: block;
        overflow-x: auto;
    }
`;

const TableHead = styled.thead`
    background: #f8fafc;
`;

const Th = styled.th`
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #475569;

    @media (max-width: 640px) {
        padding: 8px 10px;
        white-space: nowrap;
    }
`;

const Td = styled.td`
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    color: #0f172a;
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
    color: ${props => props.$danger ? '#b91c1c' : '#0ea5e9'};
    cursor: pointer;
    font-size: 13px;
    padding: 0;
    margin-right: 10px;

    &:hover {
        color: ${props => props.$danger ? '#991b1b' : '#0284c7'};
    }
`;

const EmptyState = styled.div`
    padding: 16px;
    text-align: center;
    color: #64748b;
    font-size: 14px;
`;

// ===== MAIN COMPONENT =====
export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [stockRows, setStockRows] = useState([]);

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
            {/* Form CRUD */}
            <FormSection>
                <FormTitle>
                    {editingId ? "Редактирование товара" : "Добавление товара"}
                </FormTitle>

                {error && <ErrorText>{error}</ErrorText>}
                {message && <SuccessText>{message}</SuccessText>}

                <Form onSubmit={handleSubmit}>
                    <FormField>
                        <FormLabel>Название*</FormLabel>
                        <FormInput
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Например, Молоко 2.5%"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>SKU</FormLabel>
                        <FormInput
                            name="sku"
                            value={form.sku}
                            onChange={handleChange}
                            placeholder="Артикул"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Штрих-код</FormLabel>
                        <FormInput
                            name="barcode"
                            value={form.barcode}
                            onChange={handleChange}
                            placeholder="Штрих-код"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Закупочная цена</FormLabel>
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
                        <FormLabel>Цена продажи</FormLabel>
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
                        <FormLabel>Мин. остаток</FormLabel>
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
                                ? "Сохранение..."
                                : editingId
                                    ? "Сохранить"
                                    : "Добавить"}
                        </BtnPrimary>
                        {editingId && (
                            <BtnSecondary type="button" onClick={resetForm}>
                                Отмена
                            </BtnSecondary>
                        )}
                    </ButtonGroup>
                </Form>
            </FormSection>

            {/* Products Table */}
            <SectionWrapper>
                <SectionHeader>
                    <SectionTitle>Номенклатура товаров</SectionTitle>
                    <SearchInput
                        type="text"
                        placeholder="Поиск по товарам..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </SectionHeader>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Название</Th>
                                <Th>SKU</Th>
                                <Th>Штрих-код</Th>
                                <Th>Закупочная</Th>
                                <Th>Цена продажи</Th>
                                <Th>Мин. остаток</Th>
                                <Th>Действия</Th>
                            </tr>
                        </TableHead>
                        <tbody>
                            {filteredProducts.map((p) => (
                                <tr key={p.id}>
                                    <Td>{p.name}</Td>
                                    <Td>{p.sku}</Td>
                                    <Td>{p.barcode}</Td>
                                    <Td>{p.purchase_price ?? "—"}</Td>
                                    <Td>{p.sale_price ?? "—"}</Td>
                                    <Td>{p.min_stock ?? 0}</Td>
                                    <TdActions>
                                        <LinkButton type="button" onClick={() => handleEdit(p)}>
                                            Редактировать
                                        </LinkButton>
                                        <LinkButton type="button" $danger onClick={() => handleDelete(p.id)}>
                                            Удалить
                                        </LinkButton>
                                    </TdActions>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {filteredProducts.length === 0 && !loading && (
                        <EmptyState>Товары не найдены</EmptyState>
                    )}
                </TableContainer>
            </SectionWrapper>

            {/* Stock Table */}
            <SectionWrapper>
                <SectionTitle style={{ marginBottom: 10 }}>
                    Остатки по складам (данные /products/left)
                </SectionTitle>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Склад / магазин</Th>
                                <Th>Товар</Th>
                                <Th>SKU</Th>
                                <Th>Остаток</Th>
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
                        <EmptyState>Данные по остаткам отсутствуют</EmptyState>
                    )}
                </TableContainer>
            </SectionWrapper>
        </Layout>
    );
}

