import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import movementsApi from "../../api/movementsApi";

// ===== STYLED COMPONENTS =====
const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 12px;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const TitleBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Subtitle = styled.div`
    font-size: 13px;
    color: var(--text-secondary);
`;

const FilterBar = styled.div`
    display: inline-flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 4px;
    border-radius: 999px;
    background: var(--bg-tertiary);
`;

const FilterChip = styled.button`
    border: none;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    background: ${(props) => (props.$active ? "var(--primary-color)" : "transparent")};
    color: ${(props) => (props.$active ? "#ffffff" : "var(--text-secondary)")};
    font-weight: ${(props) => (props.$active ? 600 : 500)};

    &:hover {
        background: ${(props) => (props.$active ? "var(--primary-hover)" : "var(--bg-secondary)")};
    }
`;

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

const EmptyState = styled.div`
    padding: 32px 16px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const Timeline = styled.div`
    position: relative;
    padding-left: 18px;
    margin-top: 8px;

    &::before {
        content: "";
        position: absolute;
        left: 8px;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background: var(--border-color-light);
    }
`;

const TimelineItem = styled.div`
    position: relative;
    margin-bottom: 14px;
    padding-left: 12px;
`;

const Dot = styled.div`
    position: absolute;
    left: -6px;
    top: 10px;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: ${(props) => props.$color || "var(--primary-color)"};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
`;

const ItemCard = styled.div`
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1.5fr);
    gap: 10px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const ItemTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
`;

const ItemMeta = styled.div`
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 2px;
`;

const TypeBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    color: ${(props) => props.$color || "var(--primary-color)"};
    background: ${(props) => props.$bg || "var(--primary-light)"};
    margin-right: 8px;
`;

const RightColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;

    @media (max-width: 720px) {
        align-items: flex-start;
    }
`;

const QuantityText = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
`;

const DateText = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
`;

// ===== HELPERS =====
const TYPE_META = {
    IN: { label: "IN", color: "var(--success-color)", bg: "var(--success-bg)" },
    OUT: { label: "OUT", color: "var(--error-color)", bg: "var(--error-bg)" },
    SALE: { label: "SALE", color: "var(--primary-color)", bg: "var(--primary-light)" },
    TRANSFER: { label: "TRANSFER", color: "#a855f7", bg: "rgba(168, 85, 247, 0.12)" },
    RETURN: { label: "RETURN", color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)" },
    ADJUST: { label: "ADJUST", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" },
};

function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ===== MAIN COMPONENT =====
export default function MovementsPage() {
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");

                const params = { limit: 200 };
                if (typeFilter !== "ALL") {
                    params.type = typeFilter;
                }

                const data = await movementsApi.getMovements(params);
                setMovements(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("[MovementsPage] Failed to load movements", e);
                const msg =
                    e?.response?.data?.error ||
                    e?.response?.data?.message ||
                    e?.message ||
                    "Failed to load movements journal.";
                setError(msg);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [typeFilter]);

    return (
        <Layout title="Movements journal">
            <HeaderRow>
                <TitleBlock>
                    <Subtitle>
                        Audit trail of all stock changes: incoming, outgoing, sales and transfers.
                    </Subtitle>
                </TitleBlock>

                <FilterBar>
                    {["ALL", "SALE", "IN", "OUT", "TRANSFER"].map((t) => (
                        <FilterChip
                            key={t}
                            $active={typeFilter === t}
                            onClick={() => setTypeFilter(t)}
                        >
                            {t === "ALL" ? "All types" : t}
                        </FilterChip>
                    ))}
                </FilterBar>
            </HeaderRow>

            {loading && <LoadingText>Loading...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && movements.length === 0 && !error && (
                <EmptyState>
                    No movements found. Once there are incoming, sales or write‑offs, they will
                    appear here as a timeline of events.
                </EmptyState>
            )}

            {!loading && movements.length > 0 && (
                <Timeline>
                    {movements.map((m) => {
                        const meta = TYPE_META[m.type] || TYPE_META.ADJUST;
                        const productName = m.product_name || `Product #${m.product_id}`;
                        const fromName = m.warehouse_from_name || m.warehouse_from;
                        const toName = m.warehouse_to_name || m.warehouse_to;
                        const userLabel = m.created_by_email || `user #${m.created_by || "-"}`;

                        let directionText = "";
                        if (m.type === "IN" || m.type === "RETURN") {
                            directionText = `To warehouse ${toName ?? "-"} (incoming)`;
                        } else if (m.type === "OUT" || m.type === "SALE") {
                            directionText = `From warehouse ${fromName ?? "-"} (outgoing)`;
                        } else if (m.type === "TRANSFER") {
                            directionText = `Transfer: ${fromName ?? "-"} → ${toName ?? "-"}`;
                        } else if (m.type === "ADJUST") {
                            directionText = `Adjustment at warehouse ${toName ?? "-"}`;
                        }

                        return (
                            <TimelineItem key={m.id}>
                                <Dot $color={meta.color} />
                                <ItemCard>
                                    <div>
                                        <ItemTitle>
                                            <TypeBadge $color={meta.color} $bg={meta.bg}>
                                                {meta.label}
                                            </TypeBadge>
                                            {productName}
                                        </ItemTitle>
                                        <ItemMeta>
                                            {directionText}
                                            {m.reason && ` · Reason: ${m.reason}`}
                                        </ItemMeta>
                                    </div>
                                    <RightColumn>
                                        <QuantityText>{m.quantity} pcs</QuantityText>
                                        <DateText>
                                            {formatDate(m.created_at)} · {userLabel}
                                        </DateText>
                                    </RightColumn>
                                </ItemCard>
                            </TimelineItem>
                        );
                    })}
                </Timeline>
            )}
        </Layout>
    );
}


