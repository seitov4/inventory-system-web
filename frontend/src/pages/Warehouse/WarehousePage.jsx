import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: #64748b;
    font-size: 14px;
`;

const ErrorText = styled.div`
    color: #b91c1c;
    margin-bottom: 12px;
    font-size: 14px;
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

const EmptyState = styled.div`
    padding: 18px;
    text-align: center;
    color: #64748b;
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
        <Layout title="Склад и остатки по магазинам">
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
                            </tr>
                        </TableHead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i}>
                                    <Td>{r.warehouse_name || r.store_name || "—"}</Td>
                                    <Td>{r.name}</Td>
                                    <Td>{r.sku}</Td>
                                    <Td>{r.quantity ?? r.qty ?? 0}</Td>
                                </tr>
                            ))}
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

