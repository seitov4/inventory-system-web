import React from "react";
import styled from "styled-components";
import Badge from "../ui/Badge.jsx";

const Shell = styled.div`
    border-radius: 8px;
    border: 1px solid #dbe3ef;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
    overflow: hidden;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
`;

const Thead = styled.thead`
    background: #f8fafc;
`;

const Th = styled.th`
    text-align: left;
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
`;

const Td = styled.td`
    padding: 9px 14px;
    border-bottom: 1px solid #eef2f7;
    color: #0f172a;
`;

const Tr = styled.tr`
    &:hover {
        background: #eff6ff;
    }
`;

const EmptyState = styled.div`
    padding: 20px 16px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
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


