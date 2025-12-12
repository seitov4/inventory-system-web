import React from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";

// ===== STYLED COMPONENTS =====
const FooterWrapper = styled.footer`
    background: #e5f3ff;
    padding-top: 28px;
    border-top: 1px solid #bfdbfe;
`;

const FooterInner = styled.div`
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 20px 20px;
    display: flex;
    justify-content: space-between;
    gap: 40px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 24px;
    }
`;

const FooterLeft = styled.div`
    max-width: 380px;
`;

const FooterTitle = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
`;

const FooterDesc = styled.p`
    margin-top: 8px;
    font-size: 14px;
    color: #475569;
    line-height: 1.45;
`;

const FooterRight = styled.div`
    display: flex;
    gap: 40px;

    @media (max-width: 640px) {
        flex-direction: column;
        gap: 20px;
    }
`;

const FooterCol = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const FooterColTitle = styled.div`
    font-weight: 600;
    margin-bottom: 6px;
    color: #0f172a;
`;

const FooterLink = styled.button`
    font-size: 14px;
    color: #334155;
    text-decoration: none;
    transition: 0.15s ease;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;

    &:hover {
        color: #0c4a6e;
    }
`;

const FooterMuted = styled.span`
    font-size: 12px;
    color: #64748b;
`;

const FooterBottom = styled.div`
    text-align: center;
    padding: 12px 0;
    background: #dbeafe;
    color: #475569;
    font-size: 13px;
    border-top: 1px solid #bfdbfe;
`;

// ===== COMPONENT =====
export default function Footer() {
    const { setActivePage } = usePage();

    return (
        <FooterWrapper>
            <FooterInner>
                <FooterLeft>
                    <FooterTitle>RetailSystem</FooterTitle>
                    <FooterDesc>
                        Дипломный проект: система учёта товаров, складов и продаж
                        для розничных предприятий.
                    </FooterDesc>
                </FooterLeft>

                <FooterRight>
                    <FooterCol>
                        <FooterColTitle>Разделы</FooterColTitle>
                        <FooterLink onClick={() => setActivePage("dashboard")}>Дашборд</FooterLink>
                        <FooterLink onClick={() => setActivePage("products")}>Товары</FooterLink>
                        <FooterLink onClick={() => setActivePage("warehouse")}>Склад</FooterLink>
                        <FooterLink onClick={() => setActivePage("sales")}>Продажи</FooterLink>
                    </FooterCol>

                    <FooterCol>
                        <FooterColTitle>Проект</FooterColTitle>
                        <FooterLink onClick={() => setActivePage("landing")}>О системе</FooterLink>
                        <FooterLink onClick={() => setActivePage("settings")}>Настройки</FooterLink>
                        <FooterMuted>v1.0 (MVP)</FooterMuted>
                    </FooterCol>
                </FooterRight>
            </FooterInner>

            <FooterBottom>
                © {new Date().getFullYear()} RetailSystem
            </FooterBottom>
        </FooterWrapper>
    );
}

