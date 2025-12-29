import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import productsApi from "../../api/productsApi";
import movementsApi from "../../api/movementsApi";

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

const CardsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const StockCard = styled.div`
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 14px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-color);
    }
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
`;

const ProductName = styled.div`
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
`;

const ProductSku = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
`;

const StatusPill = styled.span`
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: ${(props) =>
        props.$status === "LOW"
            ? "var(--error-bg)"
            : props.$status === "EMPTY"
            ? "var(--warning-bg)"
            : "var(--success-bg)"};
    color: ${(props) =>
        props.$status === "LOW"
            ? "var(--error-color)"
            : props.$status === "EMPTY"
            ? "var(--warning-color)"
            : "var(--success-color)"};
`;

const QtyRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--text-secondary);
`;

const ProgressBar = styled.div`
    margin-top: 4px;
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: var(--bg-tertiary);
    overflow: hidden;
`;

const ProgressFill = styled.div`
    height: 100%;
    width: ${(props) => Math.min(120, props.$percent || 0)}%;
    border-radius: 999px;
    background: ${(props) =>
        props.$status === "LOW"
            ? "var(--error-color)"
            : props.$status === "EMPTY"
            ? "var(--warning-color)"
            : "var(--primary-color)"};
`;

const ActionsRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    gap: 8px;
`;

const SmallButton = styled.button`
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;

    &:hover {
        background: var(--bg-hover);
    }
`;

const PrimarySmallButton = styled(SmallButton)`
    background: var(--primary-color);
    color: #ffffff;
    border-color: var(--primary-color);

    &:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
    }
`;

const EmptyState = styled.div`
    padding: 18px;
    text-align: center;
    color: var(--text-tertiary);
`;

const SidePanelOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    justify-content: flex-end;
    z-index: 1100;
`;

const SidePanel = styled.div`
    width: 360px;
    max-width: 100%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
`;

const SidePanelHeader = styled.div`
    padding: 14px 16px;
    border-bottom: 1px solid var(--border-color);
`;

const SidePanelTitle = styled.h2`
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
`;

const SidePanelSubtitle = styled.div`
    font-size: 12px;
    color: var(--text-secondary);
`;

const SidePanelBody = styled.div`
    padding: 12px 16px 16px;
    overflow-y: auto;
`;

const Timeline = styled.div`
    position: relative;
    padding-left: 16px;

    &::before {
        content: "";
        position: absolute;
        left: 6px;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background: var(--border-color-light);
    }
`;

const TimelineItem = styled.div`
    position: relative;
    margin-bottom: 10px;
`;

const Dot = styled.div`
    position: absolute;
    left: 1px;
    top: 8px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--primary-color);
`;

const MovementCard = styled.div`
    margin-left: 16px;
    background: var(--bg-primary);
    border-radius: 8px;
    padding: 6px 8px;
    border: 1px solid var(--border-color);
    font-size: 12px;
    color: var(--text-secondary);
`;

const CloseButton = styled.button`
    border: none;
    background: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 13px;
    padding: 4px 8px;
    float: right;
`;

// ===== MAIN COMPONENT =====
export default function WarehousePage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const [movements, setMovements] = useState([]);
    const [movementsLoading, setMovementsLoading] = useState(false);
    const [movementsError, setMovementsError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");
                const data = await productsApi.getProductsLeft();
                setRows(Array.isArray(data) ? data : []);
            } catch (e) {
            console.error(e);
            setError("Failed to load warehouse data.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredRows = useMemo(() => rows, [rows]);

    const openHistory = (row) => {
        setSelected(row);
    };

    const closeHistory = () => {
        setSelected(null);
        setMovements([]);
        setMovementsError("");
    };

    useEffect(() => {
        if (!selected) return;

        async function loadMovements() {
            try {
                setMovementsLoading(true);
                setMovementsError("");
                const data = await movementsApi.getMovements({
                    product_id: selected.id,
                    limit: 50,
                });
                setMovements(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("[Warehouse] Failed to load movements", e);
                setMovementsError(
                    e?.response?.data?.error ||
                        e?.response?.data?.message ||
                        e?.message ||
                        "Failed to load movement history."
                );
            } finally {
                setMovementsLoading(false);
            }
        }

        loadMovements();
    }, [selected]);

    const handleRefill = async (row) => {
        const qtyStr = window.prompt(
            `Refill product "${row.name}". Enter quantity:`,
            "1"
        );
        if (qtyStr === null) return;
        const qty = Number(qtyStr);
        if (!qty || Number.isNaN(qty) || qty <= 0) {
            alert("Quantity must be a positive number");
            return;
        }

        try {
            setLoading(true);
            await movementsApi.movementIn({
                product_id: row.id,
                warehouse_id: 1,
                qty,
            });
            // Update stock after refill
            try {
                const data = await productsApi.getProductsLeft();
                setRows(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("[Warehouse] Failed to reload stock after refill", e);
            }
        } catch (e) {
            console.error("[Warehouse] Failed to refill", e);
            alert(
                e?.response?.data?.error ||
                    e?.response?.data?.message ||
                    e?.message ||
                    "Failed to refill product"
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return d.toLocaleString("en-US", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Layout title="Warehouse & stock">
            {loading && <LoadingText>Loading...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && filteredRows.length === 0 && !error && (
                <EmptyState>No warehouse data</EmptyState>
            )}

            {!loading && filteredRows.length > 0 && (
                <CardsGrid>
                    {filteredRows.map((r) => {
                        const quantity = r.quantity ?? r.qty ?? 0;
                        const minStock = r.min_stock ?? 0;
                        const isEmpty = quantity === 0;
                        const isLow = !isEmpty && minStock > 0 && quantity <= minStock;
                        const status = isEmpty ? "EMPTY" : isLow ? "LOW" : "OK";
                        const percent =
                            minStock > 0
                                ? (quantity / minStock) * 100
                                : quantity > 0
                                ? 100
                                : 0;

                        return (
                            <StockCard key={r.id} onClick={() => openHistory(r)}>
                                <CardHeader>
                                    <div>
                                        <ProductName>{r.name}</ProductName>
                                        <ProductSku>{r.sku || "SKU is not set"}</ProductSku>
                                    </div>
                                    <StatusPill $status={status}>
                                            {status === "LOW"
                                                ? "LOW"
                                                : status === "EMPTY"
                                                ? "Out of stock"
                                                : "OK"}
                                    </StatusPill>
                                </CardHeader>
                                <QtyRow>
                                    <span>
                                        Stock:{" "}
                                        <strong>
                                            {quantity} pcs
                                            {minStock > 0 ? ` / min ${minStock}` : ""}
                                        </strong>
                                    </span>
                                </QtyRow>
                                <ProgressBar>
                                    <ProgressFill $percent={percent} $status={status} />
                                </ProgressBar>
                                <ActionsRow>
                                    <PrimarySmallButton
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRefill(r);
                                        }}
                                    >
                                        Refill
                                    </PrimarySmallButton>
                                    <SmallButton
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openHistory(r);
                                        }}
                                    >
                                        Movement history
                                    </SmallButton>
                                </ActionsRow>
                            </StockCard>
                        );
                    })}
                </CardsGrid>
            )}

            {selected && (
                <SidePanelOverlay onClick={closeHistory}>
                    <SidePanel onClick={(e) => e.stopPropagation()}>
                        <SidePanelHeader>
                            <CloseButton onClick={closeHistory}>Close ✕</CloseButton>
                            <SidePanelTitle>{selected.name}</SidePanelTitle>
                            <SidePanelSubtitle>
                                    SKU: {selected.sku || "—"} · ID: {selected.id}
                            </SidePanelSubtitle>
                        </SidePanelHeader>
                        <SidePanelBody>
                            {movementsLoading && (
                                <LoadingText>Loading movements history...</LoadingText>
                            )}
                            {movementsError && (
                                <ErrorText>{movementsError}</ErrorText>
                            )}
                            {!movementsLoading && movements.length === 0 && !movementsError && (
                                <EmptyState>
                                    There are no movements for this product yet. Once there are
                                    receipts, write‑offs or sales, they will appear here.
                                </EmptyState>
                            )}
                            {!movementsLoading && movements.length > 0 && (
                                <Timeline>
                                    {movements.map((m) => (
                                        <TimelineItem key={m.id}>
                                            <Dot />
                                            <MovementCard>
                                                <div>
                                                    <strong>{m.type}</strong> · {m.quantity} pcs
                                                </div>
                                                <div>{formatDate(m.created_at)}</div>
                                                {m.reason && (
                                                    <div>Reason: {m.reason}</div>
                                                )}
                                            </MovementCard>
                                        </TimelineItem>
                                    ))}
                                </Timeline>
                            )}
                        </SidePanelBody>
                    </SidePanel>
                </SidePanelOverlay>
            )}
        </Layout>
    );
}

