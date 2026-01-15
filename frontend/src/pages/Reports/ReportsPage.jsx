import React, { useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import SalesReportModal from "../../components/Reports/SalesReportModal";
import ReportCard from "../../components/Reports/ReportCard";

// ===== REPORTS CONFIGURATION =====
// Controls which reports are enabled/disabled
// Set enabled: true when backend logic is ready
const reportsConfig = {
    sales: { enabled: true },
    inventory: { enabled: false },
    profit: { enabled: false },
    movement: { enabled: false }
};

// ===== REPORTS DATA =====
const reportsData = [
    {
        key: 'sales',
        icon: '📊',
        title: 'Sales Report',
        description: 'Detailed sales data by product for a selected period. Includes quantities, prices, and totals.',
        formats: ['XLSX', 'TXT']
    },
    {
        key: 'inventory',
        icon: '📦',
        title: 'Inventory Report',
        description: 'Current stock levels, low stock alerts, and inventory valuation.',
        formats: ['XLSX', 'PDF']
    },
    {
        key: 'profit',
        icon: '💰',
        title: 'Profit & Loss',
        description: 'Revenue, costs, and profit margins analysis by period.',
        formats: ['XLSX', 'PDF']
    },
    {
        key: 'movement',
        icon: '📈',
        title: 'Movement History',
        description: 'Complete log of all stock movements: sales, purchases, transfers.',
        formats: ['XLSX', 'CSV']
    }
];

// ===== STYLED COMPONENTS =====
const PageHeader = styled.div`
    margin-bottom: 24px;
`;

const Title = styled.h1`
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px;
`;

const Subtitle = styled.p`
    font-size: 14px;
    color: var(--text-tertiary);
    margin: 0;
`;

const SectionTitle = styled.h2`
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 16px;
`;

const ReportsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
`;

// ===== COMPONENT =====
export default function ReportsPage() {
    const [showSalesModal, setShowSalesModal] = useState(false);

    const handleReportClick = (reportKey) => {
        if (reportKey === 'sales') {
            setShowSalesModal(true);
        }
        // Future: Add handlers for other reports when enabled
    };

    return (
        <Layout title="Reports">
            <PageHeader>
                <Title>Reports</Title>
                <Subtitle>
                    Generate and export business reports in various formats
                </Subtitle>
            </PageHeader>

            <SectionTitle>Available Reports</SectionTitle>
            <ReportsGrid>
                {reportsData.map(report => (
                    <ReportCard
                        key={report.key}
                        icon={report.icon}
                        title={report.title}
                        description={report.description}
                        formats={report.formats}
                        enabled={reportsConfig[report.key]?.enabled || false}
                        onClick={() => handleReportClick(report.key)}
                    />
                ))}
            </ReportsGrid>

            {/* Sales Report Modal */}
            <SalesReportModal 
                isOpen={showSalesModal} 
                onClose={() => setShowSalesModal(false)} 
            />
        </Layout>
    );
}
