import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";
import salesApi from "../../api/salesApi";

const POSContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
`;

const Section = styled.section`
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border-color);
`;

const SectionTitle = styled.h2`
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 16px;
    box-sizing: border-box;

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
`;

const CartList = styled.div`
    margin: 16px 0;
`;

const CartItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    margin-bottom: 8px;
`;

const ItemInfo = styled.div`
    flex: 1;
`;

const ItemName = styled.div`
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
`;

const ItemDetails = styled.div`
    font-size: 14px;
    color: var(--text-secondary);
`;

const ItemActions = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const QtyInput = styled.input`
    width: 60px;
    padding: 6px;
    text-align: center;
    border: 1px solid var(--border-color);
    border-radius: 6px;
`;

const RemoveBtn = styled.button`
    padding: 6px 12px;
    background: var(--error-color);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
        opacity: 0.9;
    }
`;

const TotalSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    margin-top: 16px;
`;

const TotalLabel = styled.div`
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
`;

const TotalAmount = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: var(--primary-color);
`;

const PayButton = styled.button`
    width: 100%;
    padding: 16px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const AddButton = styled.button`
    margin-top: 10px;
    padding: 10px 16px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const ErrorMessage = styled.div`
    padding: 12px;
    background: var(--error-bg);
    color: var(--error-color);
    border-radius: 8px;
    margin-bottom: 16px;
`;

const SuccessMessage = styled.div`
    padding: 12px;
    background: var(--success-bg);
    color: var(--success-color);
    border-radius: 8px;
    margin-bottom: 16px;
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
`;

const FormField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const FormLabel = styled.label`
    font-size: 14px;
    color: var(--text-secondary);
`;

const FormInput = styled.input`
    padding: 8px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
`;

export default function POSPage() {
    const [barcode, setBarcode] = useState("");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [warehouseId, setWarehouseId] = useState("1");
    const [storeId, setStoreId] = useState("1");
    const [paymentType, setPaymentType] = useState("CASH");
    const [discount, setDiscount] = useState("0");
    
    // Ref for barcode input to auto-focus and handle scanner input
    const barcodeInputRef = useRef(null);

    // Auto-focus barcode input on mount and after operations
    useEffect(() => {
        if (barcodeInputRef.current && !loading) {
            barcodeInputRef.current.focus();
        }
    }, [loading, cart.length]);

    // Play beep sound for scanner feedback (optional)
    const playBeep = () => {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = "sine";

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Silently fail if audio context is not available
        }
    };

    const handleAddProduct = async () => {
        if (!barcode.trim()) {
            setError("Enter barcode or product ID");
            return;
        }

        try {
            setError("");
            setLoading(true);

            // Try to get product by ID, SKU, barcode or name
            let product = null;
            const allProducts = await productsApi.getAll();
            product = allProducts.find(
                (p) =>
                    p.id === parseInt(barcode) ||
                    p.sku === barcode ||
                    p.barcode === barcode
            );

            // Fallback: search by name / SKU (partial match)
            if (!product) {
                const q = barcode.toLowerCase();
                product = allProducts.find(
                    (p) =>
                        (p.name || "").toLowerCase().includes(q) ||
                        (p.sku || "").toLowerCase().includes(q)
                );
            }

            if (!product) {
                setError("Product not found");
                return;
            }

            // Check if product already in cart
            const existingIndex = cart.findIndex((item) => item.product_id === product.id);
            if (existingIndex >= 0) {
                const updatedCart = [...cart];
                updatedCart[existingIndex].qty += 1;
                setCart(updatedCart);
            } else {
                // Get current stock to determine price
                const productsWithStock = await productsApi.getProductsLeft();
                const productWithStock = productsWithStock.find((p) => p.id === product.id);
                const price = productWithStock?.sale_price || product.sale_price || 0;

                setCart([
                    ...cart,
                    {
                        product_id: product.id,
                        name: product.name,
                        qty: 1,
                        price: price,
                        discount: 0,
                    },
                ]);
            }

            setBarcode("");
            // Play success beep
            playBeep();
            // Return focus to barcode input for next scan
            setTimeout(() => {
                if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                }
            }, 100);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Error while adding product");
            // Return focus even on error
            setTimeout(() => {
                if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                }
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const handleUpdateQty = (index, newQty) => {
        const qty = Math.max(1, parseInt(newQty) || 1);
        const updatedCart = [...cart];
        updatedCart[index].qty = qty;
        setCart(updatedCart);
    };

    const handlePay = async () => {
        if (cart.length === 0) {
            setError("Add products to the receipt first");
            return;
        }

        try {
            setError("");
            setSuccess("");
            setLoading(true);

            const items = cart.map((item) => ({
                product_id: item.product_id,
                qty: item.qty,
                price: item.price,
                discount: item.discount || 0,
            }));

            const result = await salesApi.create({
                store_id: parseInt(storeId) || 1,
                warehouse_id: parseInt(warehouseId) || 1,
                items,
                discount: parseFloat(discount) || 0,
                payment_type: paymentType,
            });

            const successMessage = `Sale created successfully! ID: ${result.sale_id}`;
            setSuccess(successMessage);
            setCart([]);
            // Show alert for demo purposes
            alert(successMessage);
            // Return focus to barcode input after successful sale
            setTimeout(() => {
                if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                }
            }, 100);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || "Error while creating sale");
            // Return focus on error
            setTimeout(() => {
                if (barcodeInputRef.current) {
                    barcodeInputRef.current.focus();
                }
            }, 100);
        } finally {
            setLoading(false);
        }
    };

    const total = cart.reduce((sum, item) => {
        return sum + (item.price - (item.discount || 0)) * item.qty;
    }, 0) - (parseFloat(discount) || 0);

    // Global hotkeys for POS: Enter is handled in the input, F2 triggers payment
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "F2") {
                e.preventDefault();
                if (!loading && cart.length > 0) {
                    handlePay();
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, cart.length, total]);

    return (
        <Layout title="POS - Point of sale">
            <POSContainer>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                {success && <SuccessMessage>{success}</SuccessMessage>}

                <Section>
                    <SectionTitle>Add product (barcode, ID or name)</SectionTitle>
                    <SearchInput
                        ref={barcodeInputRef}
                        type="text"
                        placeholder="Scan barcode or enter ID / name and press Enter"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => {
                            // Handle Enter key - triggers product addition
                            if (e.key === "Enter") {
                                e.preventDefault();
                                if (!loading && barcode.trim()) {
                                    handleAddProduct();
                                }
                            }
                            // Prevent form submission
                            if (e.key === "Enter") {
                                e.stopPropagation();
                            }
                        }}
                        onKeyPress={(e) => {
                            // Additional Enter handling for scanner compatibility
                            if (e.key === "Enter") {
                                e.preventDefault();
                                if (!loading && barcode.trim()) {
                                    handleAddProduct();
                                }
                            }
                        }}
                        disabled={loading}
                        autoFocus
                        autoComplete="off"
                    />
                    <AddButton
                        type="button"
                        onClick={handleAddProduct}
                        disabled={loading || !barcode.trim()}
                    >
                        Add product (Enter)
                    </AddButton>
                </Section>

                <Section>
                    <SectionTitle>Sales receipt</SectionTitle>
                    {cart.length === 0 ? (
                        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>
                            Receipt is empty. Add products.
                        </div>
                    ) : (
                        <>
                            <CartList>
                                {cart.map((item, index) => (
                                    <CartItem key={index}>
                                        <ItemInfo>
                                            <ItemName>{item.name}</ItemName>
                                            <ItemDetails>
                                                {item.price} ₸ ×{" "}
                                                <QtyInput
                                                    type="number"
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => handleUpdateQty(index, e.target.value)}
                                                    style={{ width: "50px", display: "inline-block" }}
                                                />{" "}
                                                = {(item.price * item.qty).toFixed(2)} ₸
                                            </ItemDetails>
                                        </ItemInfo>
                                        <ItemActions>
                                            <RemoveBtn onClick={() => handleRemoveItem(index)}>
                                                Remove
                                            </RemoveBtn>
                                        </ItemActions>
                                    </CartItem>
                                ))}
                            </CartList>

                            <FormRow>
                                <FormField>
                                    <FormLabel>Warehouse ID</FormLabel>
                                    <FormInput
                                        type="number"
                                        value={warehouseId}
                                        onChange={(e) => setWarehouseId(e.target.value)}
                                    />
                                </FormField>
                                <FormField>
                                    <FormLabel>Store ID</FormLabel>
                                    <FormInput
                                        type="number"
                                        value={storeId}
                                        onChange={(e) => setStoreId(e.target.value)}
                                    />
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField>
                                    <FormLabel>Payment type</FormLabel>
                                    <FormInput
                                        as="select"
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CARD">Card</option>
                                    </FormInput>
                                </FormField>
                                <FormField>
                                    <FormLabel>Discount</FormLabel>
                                    <FormInput
                                        type="number"
                                        step="0.01"
                                        value={discount}
                                        onChange={(e) => setDiscount(e.target.value)}
                                    />
                                </FormField>
                            </FormRow>

                            <TotalSection>
                                <TotalLabel>Total:</TotalLabel>
                                <TotalAmount>{total.toFixed(2)} ₸</TotalAmount>
                            </TotalSection>

                            <PayButton onClick={handlePay} disabled={loading || cart.length === 0}>
                                {loading ? "Processing..." : "Pay (F2)"}
                            </PayButton>
                        </>
                    )}
                </Section>
            </POSContainer>
        </Layout>
    );
}

