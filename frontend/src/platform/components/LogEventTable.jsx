import React from "react";
import styled from "styled-components";
import SeverityBadge from "./SeverityBadge.jsx";
import { formatTimestamp, getSourceIcon, formatSource, formatEnvironment } from "../utils/logFormatters.js";

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
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

    /* Errors visually dominate */
    ${(props) =>
        props.$severity === "error" &&
        `
        background: rgba(239, 68, 68, 0.05);
        border-left: 3px solid #ef4444;
    `}
`;

const MessageCell = styled.div`
    max-width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const SourceCell = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const StoreBadge = styled.span`
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.2);
    border-radius: 4px;
    color: #93c5fd;
    font-size: 10px;
`;

/**
 * LogEventTable Component
 * 
 * Displays logs in table format.
 * Better for desktop views with many columns.
 */
export default function LogEventTable({ logs }) {
    return (
        <Shell>
            <Table>
                <Thead>
                    <tr>
                        <Th>Time</Th>
                        <Th>Severity</Th>
                        <Th>Source</Th>
                        <Th>Environment</Th>
                        <Th>Message</Th>
                        <Th>Store</Th>
                    </tr>
                </Thead>
                <tbody>
                    {logs.map((log) => {
                        const severity = String(log.severity || "info").toLowerCase();
                        return (
                            <Tr key={log.id} $severity={severity}>
                                <Td style={{ fontSize: 11, color: "#9ca3af" }}>
                                    {formatTimestamp(log.timestamp)}
                                </Td>
                                <Td>
                                    <SeverityBadge severity={severity} />
                                </Td>
                                <Td>
                                    <SourceCell>
                                        <span>{getSourceIcon(log.source)}</span>
                                        <span>{formatSource(log.source)}</span>
                                    </SourceCell>
                                </Td>
                                <Td style={{ fontSize: 11, color: "#9ca3af" }}>
                                    {log.environment ? formatEnvironment(log.environment) : "-"}
                                </Td>
                                <Td>
                                    <MessageCell>{log.message}</MessageCell>
                                </Td>
                                <Td>
                                    {log.store ? (
                                        <StoreBadge>{log.store}</StoreBadge>
                                    ) : (
                                        <span style={{ color: "#6b7280" }}>-</span>
                                    )}
                                </Td>
                            </Tr>
                        );
                    })}
                </tbody>
            </Table>
        </Shell>
    );
}

