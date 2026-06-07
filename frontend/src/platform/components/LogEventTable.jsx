import React from "react";
import styled from "styled-components";
import SeverityBadge from "./SeverityBadge.jsx";
import { formatTimestamp, getSourceIcon, formatSource, formatEnvironment } from "../utils/logFormatters.js";

const Shell = styled.div`
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
    min-width: 900px;
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
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

    /* Errors visually dominate */
    ${(props) =>
        props.$severity === "error" &&
        `
        background: #fef2f2;
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
    background: #dbeafe;
    border-radius: 4px;
    color: #1d4ed8;
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
            <Scroll>
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
                                    <Td style={{ fontSize: 11, color: "#64748b" }}>
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
                                    <Td style={{ fontSize: 11, color: "#64748b" }}>
                                        {log.environment ? formatEnvironment(log.environment) : "-"}
                                    </Td>
                                    <Td>
                                        <MessageCell>{log.message}</MessageCell>
                                    </Td>
                                    <Td>
                                        {log.store ? (
                                            <StoreBadge>{log.store}</StoreBadge>
                                        ) : (
                                            <span style={{ color: "#64748b" }}>-</span>
                                        )}
                                    </Td>
                                </Tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Scroll>
        </Shell>
    );
}

