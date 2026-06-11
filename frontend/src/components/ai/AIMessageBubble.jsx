import React from "react";
import styled from "styled-components";

const BubbleRow = styled.div`
    display: flex;
    justify-content: ${(props) => (props.$role === "user" ? "flex-end" : "flex-start")};
`;

const Bubble = styled.div`
    max-width: min(82%, 520px);
    padding: 11px 13px;
    border-radius: ${(props) =>
        props.$role === "user" ? "18px 18px 5px 18px" : "18px 18px 18px 5px"};
    background: ${(props) =>
        props.$role === "user" ? "var(--primary-color)" : "var(--bg-tertiary)"};
    color: ${(props) => (props.$role === "user" ? "#ffffff" : "var(--text-primary)")};
    border: 1px solid
        ${(props) => (props.$role === "user" ? "transparent" : "var(--border-color-subtle)")};
    box-shadow: ${(props) =>
        props.$role === "user" ? "0 10px 22px rgba(22, 141, 255, 0.2)" : "none"};
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
`;

const Time = styled.div`
    margin-top: 5px;
    color: ${(props) => (props.$role === "user" ? "rgba(255, 255, 255, 0.72)" : "var(--text-muted)")};
    font-size: 11px;
    line-height: 1;
`;

function formatTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AIMessageBubble({ role = "assistant", content, createdAt }) {
    return (
        <BubbleRow $role={role}>
            <Bubble $role={role}>
                <div>{content}</div>
                {createdAt && <Time $role={role}>{formatTime(createdAt)}</Time>}
            </Bubble>
        </BubbleRow>
    );
}
