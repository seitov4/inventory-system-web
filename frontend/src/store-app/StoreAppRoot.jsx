import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { PageProvider, usePage } from "../context/PageContext.jsx";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.js";

// Components
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import Sidebar from "../components/Layout/Sidebar.jsx";

// Pages
import LandingPage from "../pages/LandingPage/LandingPage.jsx";
import LoginPage from "../pages/Login/LoginPage.jsx";
import RegisterPage from "../pages/Register/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPageZoneBased.jsx";
import ProductsPage from "../pages/Products/ProductsPage.jsx";
import StockInPage from "../pages/StockIn/StockInPage.jsx";
import SalesPage from "../pages/Sales/SalesPage.jsx";
import WarehousePage from "../pages/Warehouse/WarehousePage.jsx";
import SettingsPage from "../pages/Settings/SettingsPage.jsx";
import AddEmployeePage from "../pages/AddEmployee/AddEmployeePage.jsx";
import POSPage from "../pages/POS/POSPage.jsx";
import NotificationsPage from "../pages/Notifications/NotificationsPage.jsx";
import MovementsPage from "../pages/Movements/MovementsPage.jsx";
import ReportsPage from "../pages/Reports/ReportsPage.jsx";

// ---------------- GLOBAL STYLES ----------------
const GlobalStyle = createGlobalStyle`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    html,
    body,
    #root {
        min-height: 100%;
    }

    body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }

    :root,
    :root[data-theme="light"],
    body[data-theme="light"],
    :root[data-theme="dark"],
    body[data-theme="dark"] {
        --bg-primary: #F4F5FA;
        --bg-secondary: #FFFFFF;
        --bg-tertiary: #F7F8FC;
        --bg-hover: #EEF4FF;
        --bg-card: #FFFFFF;
        --bg-sidebar: #FFFFFF;
        --bg-header: rgba(255, 255, 255, 0.92);

        --text-primary: #0F172A;
        --text-secondary: #475569;
        --text-tertiary: #64748B;
        --text-muted: #94A3B8;
        --text-inverse: #FFFFFF;

        --border-color: #E6E8EF;
        --border-color-light: #EEF1F7;
        --border-color-subtle: #F0F2F7;

        --shadow-sm: 0 4px 12px rgba(15, 23, 42, 0.04);
        --shadow-md: 0 12px 28px rgba(15, 23, 42, 0.08);
        --shadow-lg: 0 22px 52px rgba(15, 23, 42, 0.12);
        --shadow-card: 0 10px 26px rgba(15, 23, 42, 0.055);

        --primary-color: #168DFF;
        --primary-hover: #2563EB;
        --primary-light: #EEF7FF;
        --primary-soft: #DCEEFF;
        --accent-purple: #6D5DF6;
        --accent-purple-soft: #F1EFFF;
        --accent-gradient: linear-gradient(135deg, #168DFF 0%, #6D5DF6 100%);
        --accent-gradient-soft: linear-gradient(135deg, rgba(22, 141, 255, 0.12) 0%, rgba(109, 93, 246, 0.12) 100%);

        --success-color: #15803D;
        --success-bg: #ECFDF3;
        --success-border: #BBF7D0;

        --error-color: #DC2626;
        --error-bg: #FEF2F2;
        --error-border: #FECACA;

        --warning-color: #B45309;
        --warning-bg: #FFFBEB;
        --warning-border: #FDE68A;

        --tint-blue: #EEF7FF;
        --tint-blue-strong: #DCEEFF;
        --tint-purple: #F1EFFF;
        --tint-purple-strong: #E7E3FF;
        --tint-green: #F0FDF4;
        --tint-green-strong: #DCFCE7;
        --tint-amber: #FFFBEB;
        --tint-amber-strong: #FEF3C7;
        --tint-neutral: #F8FAFC;
        --tint-neutral-strong: #F1F5F9;

        --radius-sm: 10px;
        --radius-md: 14px;
        --radius-lg: 20px;
        --radius-xl: 26px;
        --radius-pill: 999px;
    }

    code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
    }

    button,
    input,
    select,
    textarea {
        font: inherit;
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible,
    textarea:focus-visible {
        outline: 3px solid rgba(37, 99, 235, 0.16);
        outline-offset: 2px;
    }
`;

// ---------------- STYLED COMPONENTS ----------------
const AppRoot = styled.div`
    width: 100%;
    min-height: 100vh;
    background: var(--bg-primary);
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
`;

const AppBody = styled.div`
    flex: 1;
    display: ${(props) => (props.$withSidebar ? "grid" : "block")};
    grid-template-columns: ${(props) =>
        props.$withSidebar
            ? (props.$collapsed ? "64px" : "240px") + " minmax(0, 1fr)"
            : "1fr"};
    min-height: calc(100vh - 120px);
    transition: grid-template-columns 0.3s ease;

    @media (max-width: 900px) {
        grid-template-columns: ${(props) =>
            props.$withSidebar ? "200px minmax(0, 1fr)" : "1fr"};
    }

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
        display: block;
    }
`;

const MainContent = styled.main`
    flex: 1;
    background: var(--bg-primary);
    min-height: 100%;
    position: relative;
`;

// ------------- PAGE RENDERER -------------
function PageRenderer() {
    const { activePage } = usePage();
    const { isAuthenticated } = useAuth();

    const isPublicPage =
        activePage === "landing" || activePage === "login" || activePage === "register";

    if (!isAuthenticated && !isPublicPage) {
        return <LoginPage />;
    }

    switch (activePage) {
        case "landing":
            return <LandingPage />;
        case "login":
            return <LoginPage />;
        case "register":
            return <RegisterPage />;
        case "dashboard":
            return <DashboardPage />;
        case "products":
            return <ProductsPage />;
        case "stockIn":
            return <StockInPage />;
        case "sales":
            return <SalesPage />;
        case "warehouse":
            return <WarehousePage />;
        case "addEmployee":
            return <AddEmployeePage />;
        case "settings":
            return <SettingsPage />;
        case "pos":
            return <POSPage />;
        case "notifications":
            return <NotificationsPage />;
        case "movements":
            return <MovementsPage />;
        case "reconciliation":
            return <DashboardPage />;
        case "reports":
            return <ReportsPage />;
        default:
            return <LandingPage />;
    }
}

// ------------- APP LAYOUT -------------
function StoreAppLayout() {
    const { needsSidebar } = usePage();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        return saved === "true";
    });

    const showSidebar = needsSidebar();

    return (
        <AppRoot>
            <Header />
            <AppBody $withSidebar={showSidebar} $collapsed={sidebarCollapsed}>
                {showSidebar && <Sidebar onCollapseChange={setSidebarCollapsed} />}
                <MainContent>
                    <PageRenderer />
                </MainContent>
            </AppBody>
            <Footer />
        </AppRoot>
    );
}

// ---------------- STORE APP ROOT ----------------
export default function StoreAppRoot({ initialPage = "landing" }) {
    return (
        <ThemeProvider>
            <PageProvider>
                <GlobalStyle />
                <StoreAppLayout />
            </PageProvider>
        </ThemeProvider>
    );
}


