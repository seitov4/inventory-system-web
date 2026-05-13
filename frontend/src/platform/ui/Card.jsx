import React from "react";
import styled from "styled-components";

const Shell = styled.div`
    background: #FFFFFF;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    padding: 14px 16px;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${(props) => (props.$hasContent ? "10px" : "0")};
`;

const Title = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #111827;
`;

const Description = styled.div`
    font-size: 12px;
    color: #6B7280;
    margin-top: 2px;
`;

const Body = styled.div`
    font-size: 13px;
    color: #111827;
`;

export default function Card({ title, description, actions, children }) {
    const hasHeader = title || actions;
    const hasContent = Boolean(children);

    return (
        <Shell>
            {hasHeader && (
                <Header $hasContent={hasContent}>
                    <div>
                        {title && <Title>{title}</Title>}
                        {description && <Description>{description}</Description>}
                    </div>
                    {actions}
                </Header>
            )}
            {hasContent && <Body>{children}</Body>}
        </Shell>
    );
}


