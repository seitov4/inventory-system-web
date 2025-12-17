import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const ErrorText = styled.div`
    color: var(--error-color);
    margin-bottom: 12px;
    padding: 12px;
    background: var(--error-bg);
    border-radius: 8px;
    font-size: 14px;
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

const EmptyState = styled.div`
    padding: 18px;
    text-align: center;
    color: var(--text-tertiary);
`;

// ===== MAIN COMPONENT =====
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
        <Layout title="Склад (Stock)">
            {loading && <LoadingText>Загрузка...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Склад / магазин</Th>
                                <Th>Товар</Th>
                                <Th>SKU</Th>
                                <Th>Остаток</Th>
                                <Th>Мин. остаток</Th>
                                <Th>Статус</Th>
                            </tr>
                        </TableHead>
                        <tbody>
                            {rows.map((r, i) => {
                                const quantity = r.quantity ?? r.qty ?? 0;
                                const minStock = r.min_stock ?? 0;
                                const isLow = quantity <= minStock && minStock > 0;
                                return (
                                    <tr key={i}>
                                        <Td>{r.warehouse_name || r.store_name || "—"}</Td>
                                        <Td>{r.name}</Td>
                                        <Td>{r.sku}</Td>
                                        <Td>{quantity}</Td>
                                        <Td>{minStock}</Td>
                                        <Td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                background: isLow ? 'var(--error-bg)' : 'var(--success-bg)',
                                                color: isLow ? 'var(--error-color)' : 'var(--success-color)',
                                            }}>
                                                {isLow ? 'LOW' : 'OK'}
                                            </span>
                                        </Td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    {rows.length === 0 && (
                        <EmptyState>Данные склада отсутствуют</EmptyState>
                    )}
                </TableContainer>
            )}
        </Layout>
    );
}

