import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import DuplicateGroup from "../../components/Reconciliation/DuplicateGroup";
import productsApi from "../../api/productsApi";

// ===== STYLED COMPONENTS =====
const PageHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
`;

const Title = styled.h1`
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
`;

const ActionBar = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
`;

const MergeButton = styled.button`
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
    gap: 8px;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(88, 166, 255, 0.3);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const RefreshButton = styled.button`
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--bg-tertiary);
        border-color: var(--text-tertiary);
    }
`;

const StatsBar = styled.div`
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    flex-wrap: wrap;
`;

const StatCard = styled.div`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px 24px;
    min-width: 150px;
`;

const StatLabel = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
`;

const StatValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.$highlight ? 'var(--warning-color)' : 'var(--text-primary)'};
`;

const SectionWrapper = styled.section`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
`;

const SectionHeader = styled.div`
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-tertiary);
`;

const SectionTitle = styled.h2`
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
`;

const EmptyState = styled.div`
    padding: 48px 24px;
    text-align: center;
    color: var(--text-tertiary);
`;

const EmptyIcon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
`;

const EmptyText = styled.div`
    font-size: 16px;
    margin-bottom: 8px;
    color: var(--text-secondary);
`;

const EmptySubtext = styled.div`
    font-size: 14px;
`;

const LoadingState = styled.div`
    padding: 48px 24px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 14px;
`;

// Modal styles
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    background: var(--bg-secondary);
    border-radius: 16px;
    border: 1px solid var(--border-color);
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
`;

const ModalHeader = styled.div`
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ModalTitle = styled.h3`
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    line-height: 1;

    &:hover {
        color: var(--text-primary);
    }
`;

const ModalBody = styled.div`
    padding: 24px;
`;

const PreviewSection = styled.div`
    margin-bottom: 20px;
`;

const PreviewLabel = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
`;

const PreviewCard = styled.div`
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
`;

const PreviewRow = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
        border-bottom: none;
    }
`;

const PreviewKey = styled.span`
    color: var(--text-secondary);
    font-size: 14px;
`;

const PreviewValue = styled.span`
    color: var(--text-primary);
    font-weight: 600;
    font-size: 14px;
`;

const WarningBox = styled.div`
    background: var(--warning-bg);
    border: 1px solid var(--warning-color);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 20px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
`;

const WarningIcon = styled.span`
    font-size: 20px;
`;

const WarningText = styled.div`
    font-size: 14px;
    color: var(--warning-color);
`;

const ModalFooter = styled.div`
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
`;

const CancelButton = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--bg-tertiary);
    }
`;

const ConfirmButton = styled.button`
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background: var(--primary-color);
    color: white;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: var(--primary-hover);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// ===== MOCK DATA (for development) =====
const MOCK_PRODUCTS_WITH_DUPLICATES = [
    // Duplicate group 1: Same barcode
    { id: 1, name: "Milk 2.5%", sku: "MLK-001", barcode: "4607025391234", quantity: 15, purchase_price: 180, sale_price: 250 },
    { id: 2, name: "Milk 2.5% (duplicate)", sku: "MLK-002", barcode: "4607025391234", quantity: 10, purchase_price: 190, sale_price: 260 },
    
    // Duplicate group 2: Same SKU
    { id: 3, name: "White Bread", sku: "BRD-WHT-001", barcode: "4607025391235", quantity: 20, purchase_price: 45, sale_price: 65 },
    { id: 4, name: "Bread White", sku: "BRD-WHT-001", barcode: "4607025391299", quantity: 8, purchase_price: 50, sale_price: 70 },
    
    // Duplicate group 3: Same barcode (3 items)
    { id: 5, name: "Sugar 1kg", sku: "SGR-001", barcode: "4607025391236", quantity: 30, purchase_price: 120, sale_price: 180 },
    { id: 6, name: "Sugar 1 kg", sku: "SGR-002", barcode: "4607025391236", quantity: 15, purchase_price: 115, sale_price: 175 },
    { id: 7, name: "Sugar (1kg)", sku: "SGR-003", barcode: "4607025391236", quantity: 5, purchase_price: 125, sale_price: 185 },
    
    // Non-duplicate products
    { id: 8, name: "Rice 1kg", sku: "RCE-001", barcode: "4607025391237", quantity: 25, purchase_price: 280, sale_price: 420 },
    { id: 9, name: "Pasta 500g", sku: "PST-001", barcode: "4607025391238", quantity: 40, purchase_price: 140, sale_price: 210 },
    { id: 10, name: "Coffee 250g", sku: "COF-001", barcode: "4607025391239", quantity: 12, purchase_price: 450, sale_price: 680 },
];

// ===== HELPER FUNCTIONS =====

/**
 * Find duplicate product groups based on barcode or SKU
 * Priority: barcode > SKU
 */
function findDuplicateGroups(products) {
    const barcodeGroups = new Map();
    const skuGroups = new Map();
    const processedIds = new Set();
    const duplicateGroups = [];

    // First pass: group by barcode (highest priority)
    products.forEach(product => {
        if (product.barcode) {
            const key = product.barcode.trim().toLowerCase();
            if (!barcodeGroups.has(key)) {
                barcodeGroups.set(key, []);
            }
            barcodeGroups.get(key).push(product);
        }
    });

    // Extract barcode duplicates
    barcodeGroups.forEach((group, barcode) => {
        if (group.length > 1) {
            duplicateGroups.push({
                type: 'barcode',
                key: barcode,
                products: group
            });
            group.forEach(p => processedIds.add(p.id));
        }
    });

    // Second pass: group by SKU (for products not already in barcode groups)
    products.forEach(product => {
        if (!processedIds.has(product.id) && product.sku) {
            const key = product.sku.trim().toLowerCase();
            if (!skuGroups.has(key)) {
                skuGroups.set(key, []);
            }
            skuGroups.get(key).push(product);
        }
    });

    // Extract SKU duplicates
    skuGroups.forEach((group, sku) => {
        if (group.length > 1) {
            duplicateGroups.push({
                type: 'sku',
                key: sku,
                products: group
            });
        }
    });

    return duplicateGroups;
}

/**
 * Calculate merged product result
 * - Sum quantities
 * - Weighted average for purchase_price
 * - Latest sale_price (highest id = most recent)
 */
function calculateMergeResult(products) {
    if (!products || products.length === 0) return null;

    // Sum quantities
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

    // Weighted average purchase price
    let totalCost = 0;
    let totalQtyForPrice = 0;
    products.forEach(p => {
        const qty = p.quantity || 0;
        const price = p.purchase_price || 0;
        if (qty > 0 && price > 0) {
            totalCost += qty * price;
            totalQtyForPrice += qty;
        }
    });
    const avgPurchasePrice = totalQtyForPrice > 0 
        ? Math.round((totalCost / totalQtyForPrice) * 100) / 100 
        : 0;

    // Latest sale_price (product with highest id)
    const latestProduct = products.reduce((latest, p) => 
        p.id > latest.id ? p : latest, products[0]);

    // Use first product as base for name, sku, barcode
    const baseProduct = products[0];

    return {
        name: baseProduct.name,
        sku: baseProduct.sku,
        barcode: baseProduct.barcode,
        quantity: totalQuantity,
        purchase_price: avgPurchasePrice,
        sale_price: latestProduct.sale_price,
        merged_from: products.map(p => p.id)
    };
}

// ===== MAIN COMPONENT =====
export default function ReconciliationPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroups, setSelectedGroups] = useState(new Set());
    const [showModal, setShowModal] = useState(false);
    const [merging, setMerging] = useState(false);
    const [message, setMessage] = useState("");

    // Load products
    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setLoading(true);
        try {
            const data = await productsApi.getAll();
            if (Array.isArray(data) && data.length > 0) {
                // Add mock quantity data for demo
                const withQuantity = data.map(p => ({
                    ...p,
                    quantity: Math.floor(Math.random() * 50) + 5
                }));
                setProducts(withQuantity);
            } else {
                // Use mock data for development
                setProducts(MOCK_PRODUCTS_WITH_DUPLICATES);
            }
        } catch (error) {
            console.error("Failed to load products:", error);
            setProducts(MOCK_PRODUCTS_WITH_DUPLICATES);
        } finally {
            setLoading(false);
        }
    }

    // Find duplicate groups
    const duplicateGroups = useMemo(() => 
        findDuplicateGroups(products), [products]);

    // Calculate stats
    const stats = useMemo(() => ({
        totalProducts: products.length,
        duplicateGroups: duplicateGroups.length,
        duplicateProducts: duplicateGroups.reduce((sum, g) => sum + g.products.length, 0)
    }), [products, duplicateGroups]);

    // Handle group selection
    const handleGroupSelect = (groupIndex, selected) => {
        const newSelected = new Set(selectedGroups);
        if (selected) {
            newSelected.add(groupIndex);
        } else {
            newSelected.delete(groupIndex);
        }
        setSelectedGroups(newSelected);
    };

    // Get selected groups data
    const selectedGroupsData = useMemo(() => 
        Array.from(selectedGroups).map(idx => duplicateGroups[idx]).filter(Boolean),
        [selectedGroups, duplicateGroups]
    );

    // Calculate merge preview
    const mergePreview = useMemo(() => {
        if (selectedGroupsData.length === 0) return [];
        return selectedGroupsData.map(group => ({
            group,
            result: calculateMergeResult(group.products)
        }));
    }, [selectedGroupsData]);

    // Handle merge confirmation
    const handleMerge = async () => {
        if (mergePreview.length === 0) return;

        setMerging(true);
        try {
            // In production, this would call the backend API
            // For now, simulate the merge locally
            
            const idsToRemove = new Set();
            const newProducts = [];

            mergePreview.forEach(({ group, result }) => {
                // Mark all original products for removal
                group.products.forEach(p => idsToRemove.add(p.id));
                
                // Create merged product with new ID
                newProducts.push({
                    ...result,
                    id: Date.now() + Math.random() // Temporary ID
                });

                // Log the reconciliation movement (mock)
                console.log("Movement log:", {
                    type: "reconciliation",
                    description: `Merged duplicate products: ${group.products.map(p => p.name).join(", ")}`,
                    merged_ids: group.products.map(p => p.id),
                    result_quantity: result.quantity,
                    timestamp: new Date().toISOString()
                });
            });

            // Update products state
            setProducts(prev => [
                ...prev.filter(p => !idsToRemove.has(p.id)),
                ...newProducts
            ]);

            setMessage(`Successfully merged ${mergePreview.length} duplicate group(s)`);
            setSelectedGroups(new Set());
            setShowModal(false);

            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Merge failed:", error);
            setMessage("Failed to merge products. Please try again.");
        } finally {
            setMerging(false);
        }
    };

    return (
        <Layout title="Stock Reconciliation">
            <PageHeader>
                <Title>Stock Reconciliation</Title>
                <ActionBar>
                    <RefreshButton onClick={loadProducts} disabled={loading}>
                        🔄 Refresh
                    </RefreshButton>
                    <MergeButton 
                        onClick={() => setShowModal(true)}
                        disabled={selectedGroups.size === 0}
                    >
                        🔗 Merge Selected ({selectedGroups.size})
                    </MergeButton>
                </ActionBar>
            </PageHeader>

            {message && (
                <div style={{
                    padding: "12px 16px",
                    marginBottom: "20px",
                    background: "var(--success-bg)",
                    border: "1px solid var(--success-color)",
                    borderRadius: "8px",
                    color: "var(--success-color)",
                    fontSize: "14px"
                }}>
                    {message}
                </div>
            )}

            <StatsBar>
                <StatCard>
                    <StatLabel>Total Products</StatLabel>
                    <StatValue>{stats.totalProducts}</StatValue>
                </StatCard>
                <StatCard>
                    <StatLabel>Duplicate Groups</StatLabel>
                    <StatValue $highlight={stats.duplicateGroups > 0}>
                        {stats.duplicateGroups}
                    </StatValue>
                </StatCard>
                <StatCard>
                    <StatLabel>Products to Merge</StatLabel>
                    <StatValue $highlight={stats.duplicateProducts > 0}>
                        {stats.duplicateProducts}
                    </StatValue>
                </StatCard>
            </StatsBar>

            <SectionWrapper>
                <SectionHeader>
                    <SectionTitle>Duplicate Product Groups</SectionTitle>
                </SectionHeader>

                {loading ? (
                    <LoadingState>Loading products...</LoadingState>
                ) : duplicateGroups.length === 0 ? (
                    <EmptyState>
                        <EmptyIcon>✅</EmptyIcon>
                        <EmptyText>No duplicate products found</EmptyText>
                        <EmptySubtext>
                            All products have unique barcodes and SKUs
                        </EmptySubtext>
                    </EmptyState>
                ) : (
                    duplicateGroups.map((group, index) => (
                        <DuplicateGroup
                            key={`${group.type}-${group.key}`}
                            group={group}
                            index={index}
                            selected={selectedGroups.has(index)}
                            onSelect={(selected) => handleGroupSelect(index, selected)}
                            mergePreview={calculateMergeResult(group.products)}
                        />
                    ))
                )}
            </SectionWrapper>

            {/* Confirmation Modal */}
            {showModal && (
                <ModalOverlay onClick={() => setShowModal(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <ModalHeader>
                            <ModalTitle>Confirm Merge</ModalTitle>
                            <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
                        </ModalHeader>
                        <ModalBody>
                            <WarningBox>
                                <WarningIcon>⚠️</WarningIcon>
                                <WarningText>
                                    This action will merge {selectedGroups.size} duplicate group(s) 
                                    into single products. This cannot be undone.
                                </WarningText>
                            </WarningBox>

                            {mergePreview.map(({ group, result }, idx) => (
                                <PreviewSection key={idx}>
                                    <PreviewLabel>
                                        Group {idx + 1}: {group.products.length} products → 1 product
                                    </PreviewLabel>
                                    <PreviewCard>
                                        <PreviewRow>
                                            <PreviewKey>Name</PreviewKey>
                                            <PreviewValue>{result.name}</PreviewValue>
                                        </PreviewRow>
                                        <PreviewRow>
                                            <PreviewKey>SKU</PreviewKey>
                                            <PreviewValue>{result.sku || "—"}</PreviewValue>
                                        </PreviewRow>
                                        <PreviewRow>
                                            <PreviewKey>Barcode</PreviewKey>
                                            <PreviewValue>{result.barcode || "—"}</PreviewValue>
                                        </PreviewRow>
                                        <PreviewRow>
                                            <PreviewKey>Total Quantity</PreviewKey>
                                            <PreviewValue>{result.quantity}</PreviewValue>
                                        </PreviewRow>
                                        <PreviewRow>
                                            <PreviewKey>Purchase Price (avg)</PreviewKey>
                                            <PreviewValue>{result.purchase_price}</PreviewValue>
                                        </PreviewRow>
                                        <PreviewRow>
                                            <PreviewKey>Sale Price (latest)</PreviewKey>
                                            <PreviewValue>{result.sale_price}</PreviewValue>
                                        </PreviewRow>
                                    </PreviewCard>
                                </PreviewSection>
                            ))}
                        </ModalBody>
                        <ModalFooter>
                            <CancelButton onClick={() => setShowModal(false)}>
                                Cancel
                            </CancelButton>
                            <ConfirmButton onClick={handleMerge} disabled={merging}>
                                {merging ? "Merging..." : "Confirm Merge"}
                            </ConfirmButton>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            )}
        </Layout>
    );
}

