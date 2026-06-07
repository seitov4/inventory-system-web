import React from "react";
import styled from "styled-components";
import Card from "../ui/Card.jsx";

const Value = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
`;

const Hint = styled.div`
    font-size: 12px;
    color: #64748b;
`;

export default function StatCard({ label, value, hint, onClick }) {
    return (
        <div style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
            <Card
                title={label}
                description={null}
            >
                <Value>{value}</Value>
                {hint && <Hint>{hint}</Hint>}
            </Card>
        </div>
    );
}


