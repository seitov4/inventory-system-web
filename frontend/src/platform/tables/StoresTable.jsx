import React from "react";
import styled from "styled-components";
import StoreStatusBadge from "../components/StoreStatusBadge.jsx";
import StoreActionsMenu from "../components/StoreActionsMenu.jsx";

const TableShell = styled.div`
    border-radius: 8px;
    border: 1px solid #dbe3ef;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    overflow: hidden;
`;

const Scroll = styled.div`
    overflow-x: auto;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    min-width: 1080px;
`;

const Thead = styled.thead`
    background: #f8fafc;
`;

const Th = styled.th`
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
`;

const Td = styled.td`
    padding: 12px 16px;
    border-bottom: 1px solid #eef2f7;
    color: #0f172a;
    white-space: nowrap;
`;

const Tr = styled.tr`
    cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
    transition: background-color 0.15s ease;

    &:hover {
        background: ${(props) => (props.$clickable ? "#eff6ff" : "#f8fafc")};
    }

    ${(props) =>
        props.$inactive &&
        `
        background: #f8fafc;
        color: #94a3b8;
    `}
`;

const EmptyState = styled.div`
    padding: 20px 16px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
`;

const ActionsCell = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

export default function StoresTable({ stores, onSuspend, onResume, onArchive, onStoreClick, loading }) {
    if (!stores.length) {
        return (
            <TableShell>
                <EmptyState>No stores yet. Create the first store to onboard a tenant.</EmptyState>
            </TableShell>
        );
    }

    return (
        <TableShell>
            <Scroll>
                <Table>
                    <Thead>
                        <tr>
                            <Th>Store</Th>
                            <Th>Slug</Th>
                            <Th>Owner</Th>
                            <Th>Status</Th>
                            <Th>Plan</Th>
                            <Th>Region</Th>
                            <Th>Created</Th>
                            <Th>Last active</Th>
                            <Th style={{ textAlign: "right" }}>Actions</Th>
                        </tr>
                    </Thead>
                    <tbody>
                        {stores.map((store) => {
                            const status = String(store.status || "").toLowerCase();
                            const isInactive = status === "inactive" || status === "deleted";

                            return (
                                <Tr
                                    key={store.id}
                                    $inactive={isInactive}
                                    $clickable={!!onStoreClick && !isInactive}
                                    onClick={() => {
                                        if (onStoreClick && !isInactive) {
                                            onStoreClick(store.id);
                                        }
                                    }}
                                >
                                    <Td>{store.name}</Td>
                                    <Td>{store.slug}</Td>
                                    <Td>{store.ownerEmail || "-"}</Td>
                                    <Td><StoreStatusBadge status={store.status} /></Td>
                                    <Td>{store.plan || "standard"}</Td>
                                    <Td>{store.region || "local"}</Td>
                                    <Td>{store.createdAt || "-"}</Td>
                                    <Td>{store.lastActiveAt || "-"}</Td>
                                    <Td>
                                        <ActionsCell>
                                            <StoreActionsMenu
                                                store={store}
                                                onSuspend={onSuspend}
                                                onResume={onResume}
                                                onArchive={onArchive}
                                                loading={loading}
                                            />
                                        </ActionsCell>
                                    </Td>
                                </Tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Scroll>
        </TableShell>
    );
}
