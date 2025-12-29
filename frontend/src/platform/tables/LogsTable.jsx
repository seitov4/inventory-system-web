import React from "react";
import styled from "styled-components";
import Badge from "../ui/Badge.jsx";

const Shell = styled.div`
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
`;

const Tr = styled.tr`
    &:hover {
        background: rgba(30, 64, 175, 0.18);
    }
`;

const EmptyState = styled.div`
    padding: 20px 16px;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
`;

function toneForSeverity(sev) {
    if (sev === "error") return "red";
    if (sev === "warn") return "yellow";
    return "blue";
}

export default function LogsTable({ logs }) {
    if (!logs.length) {
        return (
            <Shell>
                <EmptyState>No logs yet. Platform has no events in this time range.</EmptyState>
            </Shell>
        );
    }

    return (
        <Shell>
            <Table>
                <Thead>
                    <tr>
                        <Th>Time</Th>
                        <Th>Severity</Th>
                        <Th>Source</Th>
                        <Th>Message</Th>
                    </tr>
                </Thead>
                <tbody>
                    {logs.map((log) => (
                        <Tr key={log.id}>
                            <Td>{log.timestamp}</Td>
                            <Td>
                                <Badge tone={toneForSeverity(log.severity)} size="small">
                                    {log.severity.toUpperCase()}
                                </Badge>
                            </Td>
                            <Td>{log.source}</Td>
                            <Td>{log.message}</Td>
                        </Tr>
                    ))}
                </tbody>
            </Table>
        </Shell>
    );
}


