import React from "react";
import styled from "styled-components";

// ===== STYLED COMPONENTS =====
const GroupWrapper = styled.div`
    border-bottom: 1px solid var(--border-color);
    
    &:last-child {
        border-bottom: none;
    }
`;

const GroupHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: ${props => props.$selected ? 'var(--primary-light)' : 'transparent'};
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: ${props => props.$selected ? 'var(--primary-light)' : 'var(--bg-hover)'};
    }
`;

const Checkbox = styled.input`
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: var(--primary-color);
`;

const GroupInfo = styled.div`
    flex: 1;
`;

const GroupTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
`;

const GroupMeta = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
    display: flex;
    gap: 16px;
`;

const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: ${props => props.$type === 'barcode' ? 'var(--primary-light)' : 'var(--warning-bg)'};
    color: ${props => props.$type === 'barcode' ? 'var(--primary-color)' : 'var(--warning-color)'};
`;

const PreviewBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: var(--success-bg);
    color: var(--success-color);
`;

const ProductsTable = styled.div`
    padding: 0 20px 16px 56px;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
`;

const Th = styled.th`
    text-align: left;
    padding: 8px 12px;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: 12px;
`;

const Td = styled.td`
    padding: 10px 12px;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);

    tr:last-child & {
        border-bottom: none;
    }
`;

const MergePreviewRow = styled.tr`
    background: var(--success-bg);
    
    td {
        font-weight: 600;
        color: var(--success-color);
    }
`;

const ArrowIcon = styled.span`
    display: inline-block;
    margin-right: 8px;
`;

// ===== COMPONENT =====
export default function DuplicateGroup({ 
    group, 
    index, 
    selected, 
    onSelect,
    mergePreview 
}) {
    const { type, key, products } = group;

    return (
        <GroupWrapper>
            <GroupHeader 
                $selected={selected}
                onClick={() => onSelect(!selected)}
            >
                <Checkbox
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onSelect(e.target.checked);
                    }}
                />
                <GroupInfo>
                    <GroupTitle>
                        Duplicate Group #{index + 1}: {products[0]?.name}
                    </GroupTitle>
                    <GroupMeta>
                        <span>{products.length} products</span>
                        <span>Total qty: {products.reduce((s, p) => s + (p.quantity || 0), 0)}</span>
                    </GroupMeta>
                </GroupInfo>
                <Badge $type={type}>
                    {type === 'barcode' ? '🏷️ Same Barcode' : '📋 Same SKU'}
                </Badge>
                {selected && mergePreview && (
                    <PreviewBadge>
                        → Qty: {mergePreview.quantity} | Price: {mergePreview.purchase_price}
                    </PreviewBadge>
                )}
            </GroupHeader>

            <ProductsTable>
                <Table>
                    <thead>
                        <tr>
                            <Th>Name</Th>
                            <Th>SKU</Th>
                            <Th>Barcode</Th>
                            <Th>Quantity</Th>
                            <Th>Purchase Price</Th>
                            <Th>Sale Price</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <Td>{product.name}</Td>
                                <Td>{product.sku || "—"}</Td>
                                <Td>{product.barcode || "—"}</Td>
                                <Td>{product.quantity || 0}</Td>
                                <Td>{product.purchase_price || "—"}</Td>
                                <Td>{product.sale_price || "—"}</Td>
                            </tr>
                        ))}
                        {selected && mergePreview && (
                            <MergePreviewRow>
                                <Td>
                                    <ArrowIcon>→</ArrowIcon>
                                    {mergePreview.name} (merged)
                                </Td>
                                <Td>{mergePreview.sku || "—"}</Td>
                                <Td>{mergePreview.barcode || "—"}</Td>
                                <Td>{mergePreview.quantity}</Td>
                                <Td>{mergePreview.purchase_price} (avg)</Td>
                                <Td>{mergePreview.sale_price} (latest)</Td>
                            </MergePreviewRow>
                        )}
                    </tbody>
                </Table>
            </ProductsTable>
        </GroupWrapper>
    );
}

