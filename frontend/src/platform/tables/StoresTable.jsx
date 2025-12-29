import React from "react";
import styled from "styled-components";
import StoreStatusBadge from "../components/StoreStatusBadge.jsx";
import StoreProvisioningIndicator from "../components/StoreProvisioningIndicator.jsx";
import StoreActionsMenu from "../components/StoreActionsMenu.jsx";

const TableShell = styled.div`
    border-radius: 16px;
    border: 1px solid rgba(31, 41, 55, 0.9);
    background: rgba(15, 23, 42, 0.98);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.7);
    overflow: hidden;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
`;

const Thead = styled.thead`
    background: rgba(15, 23, 42, 0.98);
`;

const Th = styled.th`
    text-align: left;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(31, 41, 55, 0.9);
    font-weight: 600;
    color: #9ca3af;
    white-space: nowrap;
`;

const Td = styled.td`
    padding: 9px 14px;
    border-bottom: 1px solid rgba(31, 41, 55, 0.9);
    color: #e5e7eb;
    white-space: nowrap;
`;

const Tr = styled.tr`
    cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
    transition: background-color 0.15s ease;

    &:hover {
        background: ${(props) =>
            props.$clickable
                ? "rgba(30, 64, 175, 0.25)"
                : "rgba(30, 64, 175, 0.18)"};
    }

    /* Visually distinct for archived stores */
    ${(props) =>
        props.$archived &&
        `
        opacity: 0.7;
        background: rgba(31, 41, 55, 0.5);
    `}
`;

const EmptyState = styled.div`
    padding: 20px 16px;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
`;

const StatusCell = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
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
                        const isArchived = store.status === "archived";
                        const isProvisioning = store.status === "provisioning";

                        return (
                            <Tr
                                key={store.id}
                                $archived={isArchived}
                                $clickable={!!onStoreClick}
                                onClick={() => {
                                    if (onStoreClick && !isArchived) {
                                        onStoreClick(store.id);
                                    }
                                }}
                            >
                                <Td>{store.name}</Td>
                                <Td>{store.slug}</Td>
                                <Td>{store.ownerEmail}</Td>
                                <Td>
                                    <StatusCell>
                                        <StoreStatusBadge status={store.status} />
                                        {isProvisioning && <StoreProvisioningIndicator />}
                                    </StatusCell>
                                </Td>
                                <Td>{store.plan}</Td>
                                <Td>{store.region}</Td>
                                <Td>{store.createdAt}</Td>
                                <Td>{store.lastActiveAt}</Td>
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
        </TableShell>
    );
}
