import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";
import { getApiErrorMessage } from "../../api/apiClient";
import ProductImportModal from "../../components/Products/ProductImportModal";

// ===== STYLED COMPONENTS =====
const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
`;

const HeaderButtons = styled.div`
    display: flex;
    gap: 12px;
    
    @media (max-width: 640px) {
        flex-direction: column;
        width: 100%;
    }
`;

const AddProductButton = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background: var(--primary-color);
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    @media (max-width: 640px) {
        width: 100%;
        justify-content: center;
    }
`;

const ImportButton = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &:hover {
        background: var(--bg-tertiary);
        border-color: var(--primary-color);
        color: var(--text-primary);
    }
    
    @media (max-width: 640px) {
        width: 100%;
        justify-content: center;
    }
`;

const FormSection = styled.section`
    margin-bottom: 20px;
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 0;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    overflow: hidden;
    max-height: ${props => props.$isOpen ? '2000px' : '0'};
    opacity: ${props => props.$isOpen ? '1' : '0'};
    transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                margin-bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: ${props => props.$isOpen ? '20px' : '0'};
`;

const FormSectionContent = styled.div`
    padding: 16px;
`;

const FormHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const CloseButton = styled.button`
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: var(--text-tertiary);
    font-size: 20px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    line-height: 1;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }
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

function parseLocaleNumber(value, fallback = 0) {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : NaN;
    }

    const raw = String(value).trim().replace(/\s/g, "");
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");

    let normalized = raw;
    if (lastComma >= 0 && lastDot >= 0) {
        const decimalSeparator = lastComma > lastDot ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";
        normalized = raw
            .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
            .replace(decimalSeparator, ".");
    } else if (lastComma >= 0) {
        normalized = raw.replace(",", ".");
    }

    return Number(normalized);
}

const PRODUCTS_PER_PAGE = 30;
const FILTER_OPTIONS = {
    ALL: "all",
    LOW_STOCK: "low_stock",
    NO_MOVEMENTS_30: "no_movements_30_days",
};

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

const PaginationBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-secondary);

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const TopPaginationBar = styled(PaginationBar)`
    margin-top: 10px;
    border: 1px solid var(--border-color);
    border-radius: 12px 12px 0 0;
`;

const PaginationMeta = styled.div`
    color: var(--text-secondary);
    font-size: 13px;
`;

const PaginationControls = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
`;

const PageButton = styled.button`
    min-width: 34px;
    height: 34px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid ${props => (props.$active ? "var(--primary-color)" : "var(--border-color)")};
    background: ${props => (props.$active ? "var(--primary-color)" : "var(--bg-primary)")};
    color: ${props => (props.$active ? "#ffffff" : "var(--text-secondary)")};
    font-size: 13px;
    font-weight: ${props => (props.$active ? 700 : 600)};
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: var(--primary-color);
        color: ${props => (props.$active ? "#ffffff" : "var(--text-primary)")};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;

const PageEllipsis = styled.span`
    min-width: 22px;
    text-align: center;
    color: var(--text-tertiary);
`;

function ProductsPagination({
    pagination,
    loading,
    page,
    pageNumbers,
    showingFrom,
    showingTo,
    onPageChange,
    as = PaginationBar,
}) {
    const Wrapper = as;

    if (pagination.total <= 0) {
        return null;
    }

    return (
        <Wrapper>
            <PaginationMeta>
                Showing {showingFrom}-{showingTo} of {pagination.total} products
            </PaginationMeta>
            <PaginationControls>
                <PageButton
                    type="button"
                    disabled={!pagination.has_prev || loading}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </PageButton>
                {pageNumbers.map((pageNumber, index) => (
                    <React.Fragment key={pageNumber}>
                        {index > 0 && pageNumber - pageNumbers[index - 1] > 1 && (
                            <PageEllipsis>...</PageEllipsis>
                        )}
                        <PageButton
                            type="button"
                            $active={pageNumber === pagination.page}
                            disabled={loading}
                            onClick={() => onPageChange(pageNumber)}
                        >
                            {pageNumber}
                        </PageButton>
                    </React.Fragment>
                ))}
                <PageButton
                    type="button"
                    disabled={!pagination.has_next || loading}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </PageButton>
            </PaginationControls>
        </Wrapper>
    );
}

// ===== MAIN COMPONENT =====
export default function ProductsPage() {
    const [products, setProducts] = useState([]);

    const [form, setForm] = useState({
        name: "",
        sku: "",
        barcode: "",
        purchase_price: "",
        sale_price: "",
        min_stock: "",
    });
    const [editingId, setEditingId] = useState(null);

    const [q, setQ] = useState(() => {
        const fromSearch = sessionStorage.getItem("globalSearchQuery");
        const fromNotification = sessionStorage.getItem("lastNotificationProductId");
        if (fromSearch) {
            sessionStorage.removeItem("globalSearchQuery");
            return fromSearch;
        }
        if (fromNotification) {
            sessionStorage.removeItem("lastNotificationProductId");
            return fromNotification;
        }
        return "";
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [filter, setFilter] = useState("ALL"); // ALL | LOW_STOCK | NO_MOVEMENTS_30
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PRODUCTS_PER_PAGE,
        total: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false,
    });
    const [counts, setCounts] = useState({
        all: 0,
        low_stock: 0,
        no_movements_30: 0,
    });

    const [inlineEdit, setInlineEdit] = useState({
        id: null,
        field: null,
        value: "",
    });
    
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const loadProducts = useCallback(async (nextPage = page, nextSearch = q, nextFilter = filter) => {
        try {
            setLoading(true);
            setError("");
            const result = await productsApi.getPage({
                page: nextPage,
                limit: PRODUCTS_PER_PAGE,
                search: nextSearch,
                filter: FILTER_OPTIONS[nextFilter] || "all",
            });
            const loadedProducts = Array.isArray(result?.products) ? result.products : [];

            setProducts(loadedProducts);

            if (result?.pagination) {
                setPagination(result.pagination);
                if (result.pagination.page !== nextPage) {
                    setPage(result.pagination.page);
                }
            }

            setCounts({
                all: Number(result?.counts?.all || 0),
                low_stock: Number(result?.counts?.low_stock || 0),
                no_movements_30: Number(result?.counts?.no_movements_30 || 0),
            });
        } catch (e) {
            console.error(e);
            setError("Failed to load product data.");
        } finally {
            setLoading(false);
        }
    }, [filter, page, q]);

    useEffect(() => {
        loadProducts(page, q, filter);
    }, [page, q, filter, loadProducts]);

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
        setError("");
        setMessage("");
    };
    
    const handleOpenPanel = () => {
        resetForm();
        setIsPanelOpen(true);
    };
    
    const handleClosePanel = () => {
        setIsPanelOpen(false);
        resetForm();
    };
    
    // Handle Esc key to close panel
    useEffect(() => {
        if (!isPanelOpen) return;
        
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsPanelOpen(false);
                resetForm();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isPanelOpen]);

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

        const numeric = parseLocaleNumber(inlineEdit.value);
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
            await loadProducts();
        } catch (e) {
            console.error(e);
            setError(getApiErrorMessage(e, "Failed to update product."));
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
        setIsPanelOpen(true); // Open panel when editing
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            setSaving(true);
            setError("");
            setMessage("");
            const result = await productsApi.remove(id);
            setMessage(result?.message || "Product deleted.");
            if (products.length === 1 && page > 1) {
                setPage((current) => Math.max(1, current - 1));
            } else {
                await loadProducts();
            }
        } catch (e) {
            console.error(e);
            setError(getApiErrorMessage(e, "Failed to delete product."));
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
                ? parseLocaleNumber(form.purchase_price)
                : 0,
            sale_price: form.sale_price ? parseLocaleNumber(form.sale_price) : 0,
            min_stock: form.min_stock ? parseLocaleNumber(form.min_stock) : 0,
        };

        if (
            Number.isNaN(payload.purchase_price) ||
            Number.isNaN(payload.sale_price) ||
            Number.isNaN(payload.min_stock)
        ) {
            setError("Prices and min. stock must be valid numbers.");
            return;
        }

        try {
            setSaving(true);
            if (editingId) {
                await productsApi.update(editingId, payload);
                setMessage("Product updated.");
                // Close panel after successful update
                setTimeout(() => {
                    setIsPanelOpen(false);
                    resetForm();
                }, 1000);
            } else {
                await productsApi.create(payload);
                setMessage("Product created.");
                setPage(1);
                // Close panel after successful creation
                setTimeout(() => {
                    setIsPanelOpen(false);
                    resetForm();
                }, 1000);
            }
            await loadProducts(editingId ? page : 1, q, filter);
        } catch (e) {
            console.error(e);
            setError(getApiErrorMessage(e, "Failed to save product."));
        } finally {
            setSaving(false);
        }
    };

    const productQuantityMap = useMemo(() => {
        const map = new Map();
        products.forEach((product) => {
            map.set(product.id, product.quantity ?? product.qty ?? 0);
        });
        return map;
    }, [products]);

    const pageNumbers = useMemo(() => {
        const totalPages = pagination.total_pages || 1;
        const current = pagination.page || page;
        const pages = new Set([1, totalPages]);

        for (let value = current - 1; value <= current + 1; value++) {
            if (value >= 1 && value <= totalPages) {
                pages.add(value);
            }
        }

        return Array.from(pages).sort((a, b) => a - b);
    }, [page, pagination.page, pagination.total_pages]);

    const showingFrom = pagination.total === 0
        ? 0
        : (pagination.page - 1) * pagination.limit + 1;
    const showingTo = Math.min(pagination.page * pagination.limit, pagination.total);

    const emptyMessage = q.trim()
        ? "No products match your search."
        : filter === "LOW_STOCK"
            ? "No low-stock products found."
            : filter === "NO_MOVEMENTS_30"
                ? "No products without movements found."
                : "No products found.";

    const handleSearchChange = (e) => {
        setQ(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (nextFilter) => {
        setFilter(nextFilter);
        setPage(1);
    };

    const goToPage = (nextPage) => {
        const totalPages = pagination.total_pages || 1;
        setPage(Math.min(Math.max(1, nextPage), totalPages));
    };

    return (
        <Layout title="Products & stock">
            {/* Page Header with Add Button */}
            <PageHeader>
                <div></div> {/* Spacer for alignment */}
                <HeaderButtons>
                    <ImportButton
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                    >
                        <span>📥</span>
                        <span>Import products</span>
                    </ImportButton>
                    <AddProductButton
                        type="button"
                        onClick={handleOpenPanel}
                        disabled={isPanelOpen}
                    >
                        <span>+</span>
                        <span>Add product</span>
                    </AddProductButton>
                </HeaderButtons>
            </PageHeader>

            {/* Collapsible Form Panel */}
            <FormSection $isOpen={isPanelOpen}>
                <FormSectionContent>
                    <FormHeader>
                        <FormTitle>
                            {editingId ? "Edit product" : "New product"}
                        </FormTitle>
                        <CloseButton
                            type="button"
                            onClick={handleClosePanel}
                            title="Close (Esc)"
                        >
                            ✕
                        </CloseButton>
                    </FormHeader>

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
                            type="text"
                            inputMode="decimal"
                            value={form.purchase_price}
                            onChange={handleChange}
                            placeholder="0.00"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel>Sale price</FormLabel>
                        <FormInput
                            name="sale_price"
                            type="text"
                            inputMode="decimal"
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
                            <BtnSecondary type="button" onClick={handleClosePanel}>
                                Cancel
                            </BtnSecondary>
                        </ButtonGroup>
                    </Form>
                </FormSectionContent>
            </FormSection>

            {/* Products Table */}
            <SectionWrapper>
                <SectionHeader>
                    <SectionTitle>Product catalog</SectionTitle>
                    <SearchInput
                        type="text"
                        placeholder="Search products..."
                        value={q}
                        onChange={handleSearchChange}
                    />
                </SectionHeader>
                <FilterChipsRow>
                    <FilterChip
                        type="button"
                        $active={filter === "ALL"}
                        onClick={() => handleFilterChange("ALL")}
                    >
                        All ({counts.all})
                    </FilterChip>
                    <FilterChip
                        type="button"
                        $active={filter === "LOW_STOCK"}
                        onClick={() => handleFilterChange("LOW_STOCK")}
                    >
                        Low stock ({counts.low_stock})
                    </FilterChip>
                    <FilterChip
                        type="button"
                        $active={filter === "NO_MOVEMENTS_30"}
                        onClick={() => handleFilterChange("NO_MOVEMENTS_30")}
                    >
                        No movements 30 days
                        {counts.no_movements_30 > 0 ? ` (${counts.no_movements_30})` : ""}
                    </FilterChip>
                </FilterChipsRow>

                <ProductsPagination
                    pagination={pagination}
                    loading={loading}
                    page={page}
                    pageNumbers={pageNumbers}
                    showingFrom={showingFrom}
                    showingTo={showingTo}
                    onPageChange={goToPage}
                    as={TopPaginationBar}
                />

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
                            {products.map((p) => (
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
                                                type="text"
                                                inputMode="decimal"
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

                    {products.length === 0 && !loading && (
                        <EmptyState>{emptyMessage}</EmptyState>
                    )}

                    <ProductsPagination
                        pagination={pagination}
                        loading={loading}
                        page={page}
                        pageNumbers={pageNumbers}
                        showingFrom={showingFrom}
                        showingTo={showingTo}
                        onPageChange={goToPage}
                    />
                </TableContainer>
            </SectionWrapper>

            {/* Stock Table */}
            <SectionWrapper>
                <SectionTitle style={{ marginBottom: 10 }}>
                    Stock summary for current page
                </SectionTitle>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Category</Th>
                                <Th>Product</Th>
                                <Th>SKU</Th>
                                <Th>Quantity</Th>
                            </tr>
                        </TableHead>
                        <tbody>
                            {products.map((r) => (
                                <tr key={r.id}>
                                    <Td>{r.category || "-"}</Td>
                                    <Td>{r.name}</Td>
                                    <Td>{r.sku}</Td>
                                    <Td>{r.quantity ?? r.qty ?? 0}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {products.length === 0 && (
                        <EmptyState>No stock data available</EmptyState>
                    )}
                </TableContainer>
            </SectionWrapper>

            {/* Product Import Modal */}
            <ProductImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    setIsImportModalOpen(false);
                    setPage(1);
                    loadProducts(1, q, filter);
                }}
            />
        </Layout>
    );
}

