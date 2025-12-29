import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";
import movementsApi from "../../api/movementsApi";

// ===== STYLED COMPONENTS =====
const FormSection = styled.section`
    max-width: 600px;
    margin: 0 auto;
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
`;

const FormTitle = styled.h2`
    margin: 0 0 20px;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
`;

const ErrorText = styled.div`
    color: var(--error-color);
    margin-bottom: 16px;
    padding: 12px;
    background: var(--error-bg);
    border-radius: 8px;
    font-size: 14px;
`;

const SuccessText = styled.div`
    color: var(--success-color);
    margin-bottom: 16px;
    padding: 12px;
    background: var(--success-bg);
    border-radius: 8px;
    font-size: 14px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const FormField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const FormLabel = styled.label`
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
`;

const FormInput = styled.input`
    width: 100%;
    padding: 12px;
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

const FormSelect = styled.select`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 14px;
    box-sizing: border-box;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;

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

const FormTextarea = styled.textarea`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 14px;
    box-sizing: border-box;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 80px;
    resize: vertical;
    font-family: inherit;

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

const SubmitButton = styled.button`
    padding: 12px 24px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        background: var(--text-tertiary);
        cursor: not-allowed;
    }
`;

// ===== MAIN COMPONENT =====
export default function StockInPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        product_id: "",
        warehouse_id: "1",
        qty: "",
        comment: "",
    });

    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                const data = await productsApi.getAll();
                setProducts(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to load products:", e);
                setError("Failed to load product list");
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear messages when user starts typing
        if (error) setError("");
        if (success) setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (!form.product_id) {
            setError("Select a product");
            return;
        }
        if (!form.warehouse_id) {
            setError("Specify warehouse ID");
            return;
        }
        
        // Validate and convert qty to number
        const qty = Number(form.qty);
        if (!form.qty || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
            setError("Quantity must be a positive integer");
            return;
        }

        // Validate product_id and warehouse_id are numbers
        const productId = Number(form.product_id);
        const warehouseId = Number(form.warehouse_id);
        
        if (isNaN(productId) || productId <= 0) {
            setError("Invalid product ID");
            return;
        }
        
        if (isNaN(warehouseId) || warehouseId <= 0) {
            setError("Warehouse ID must be a positive number");
            return;
        }

        try {
            setSaving(true);
            // Prepare request data
            const requestData = {
                product_id: productId,
                warehouse_id: warehouseId,
                qty: qty,
            };
            
            // Add comment only if it's not empty
            if (form.comment && form.comment.trim()) {
                requestData.comment = form.comment.trim();
            }
            
            const result = await movementsApi.movementIn(requestData);

            // Handle response structure: backend returns { success: true, data: { new_quantity, ... } }
            // movementsApi returns r.data?.data || r.data, so result can be either { new_quantity } or { data: { new_quantity } }
            const newQuantity = result?.new_quantity ?? result?.data?.new_quantity;
            
            if (newQuantity !== undefined) {
                setSuccess(
                    `Product successfully added to warehouse. New quantity: ${newQuantity}`
                );
            } else {
                setSuccess("Product successfully added to warehouse.");
            }

            // Reset form (keep warehouse_id for convenience)
            setForm({
                product_id: "",
                warehouse_id: form.warehouse_id,
                qty: "",
                comment: "",
            });
        } catch (e) {
            console.error("Failed to add stock:", e);
            
            // Extract error message from various possible locations
            const errorMessage = 
                e?.response?.data?.error || 
                e?.response?.data?.message ||
                e?.message ||
                "Error while adding product to warehouse";
            
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Stock intake">
            <FormSection>
                <FormTitle>Incoming stock to warehouse</FormTitle>

                {error && <ErrorText>{error}</ErrorText>}
                {success && <SuccessText>{success}</SuccessText>}

                <Form onSubmit={handleSubmit}>
                    <FormField>
                                <FormLabel htmlFor="product_id">
                            Product <span style={{ color: "var(--error-color)" }}>*</span>
                        </FormLabel>
                        <FormSelect
                            id="product_id"
                            name="product_id"
                            value={form.product_id}
                            onChange={handleChange}
                            disabled={loading || saving}
                            required
                        >
                            <option value="">Select product...</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} {product.sku ? `(${product.sku})` : ""}
                                </option>
                            ))}
                        </FormSelect>
                    </FormField>

                    <FormField>
                                <FormLabel htmlFor="warehouse_id">
                            Warehouse ID <span style={{ color: "var(--error-color)" }}>*</span>
                        </FormLabel>
                        <FormInput
                            id="warehouse_id"
                            name="warehouse_id"
                            type="number"
                            min="1"
                            value={form.warehouse_id}
                            onChange={handleChange}
                            disabled={loading || saving}
                            required
                        />
                    </FormField>

                    <FormField>
                                <FormLabel htmlFor="qty">
                            Quantity <span style={{ color: "var(--error-color)" }}>*</span>
                        </FormLabel>
                        <FormInput
                            id="qty"
                            name="qty"
                            type="number"
                            min="1"
                            step="1"
                            value={form.qty}
                            onChange={handleChange}
                            disabled={loading || saving}
                            required
                            placeholder="Enter quantity (integer)"
                        />
                    </FormField>

                    <FormField>
                        <FormLabel htmlFor="comment">Comment (optional)</FormLabel>
                        <FormTextarea
                            id="comment"
                            name="comment"
                            value={form.comment}
                            onChange={handleChange}
                            disabled={loading || saving}
                            placeholder="Initial stock, supplier delivery, etc."
                        />
                    </FormField>

                    <SubmitButton type="submit" disabled={loading || saving}>
                        {saving ? "Adding..." : "Add to warehouse"}
                    </SubmitButton>
                </Form>
            </FormSection>
        </Layout>
    );
}

