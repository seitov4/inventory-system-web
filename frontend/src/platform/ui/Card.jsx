import React from "react";
import styled from "styled-components";

const Shell = styled.div`
    background: rgba(15, 23, 42, 0.95);
    border-radius: 16px;
    border: 1px solid rgba(31, 41, 55, 0.9);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.65);
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
    color: #e5e7eb;
`;

const Description = styled.div`
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
`;

const Body = styled.div`
    font-size: 13px;
    color: #e5e7eb;
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


