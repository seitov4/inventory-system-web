import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { PageProvider, usePage } from "../context/PageContext.jsx";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import { AuthProvider, useAuth } from "../context/AuthContext.js";

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

// ---------------- GLOBAL STYLES ----------------
const GlobalStyle = createGlobalStyle`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: var(--bg-primary);
        color: var(--text-primary);
    }

    /* Light Theme */
    :root[data-theme="light"],
    body[data-theme="light"] {
        /* Backgrounds */
        --bg-primary: #F9FAFB;
        --bg-secondary: #FFFFFF;
        --bg-tertiary: #F3F4F6;
        --bg-hover: #F9FAFB;
        
        /* Text */
        --text-primary: #111827;
        --text-secondary: #4B5563;
        --text-tertiary: #6B7280;
        --text-inverse: #FFFFFF;
        
        /* Borders */
        --border-color: #E5E7EB;
        --border-color-light: rgba(107, 114, 128, 0.2);
        
        /* Shadows */
        --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
        --shadow-lg: 0 6px 20px rgba(0, 0, 0, 0.1);
        
        /* Primary */
        --primary-color: #3B82F6;
        --primary-hover: #2563EB;
        --primary-light: #DBEAFE;
        
        /* Success */
        --success-color: #10B981;
        --success-bg: rgba(16, 185, 129, 0.1);
        
        /* Error */
        --error-color: #EF4444;
        --error-bg: rgba(239, 68, 68, 0.1);
        
        /* Warning */
        --warning-color: #F59E0B;
        --warning-bg: rgba(245, 158, 11, 0.1);
    }

    /* Dark Theme (Default) */
    :root[data-theme="dark"],
    body[data-theme="dark"],
    :root:not([data-theme]),
    body:not([data-theme]) {
        /* Backgrounds - Layered system for depth */
        --bg-primary: #0D1117;
        --bg-secondary: #161B22;
        --bg-tertiary: #1C2128;
        --bg-hover: #22272E;
        --bg-card: #1C2128;
        --bg-sidebar: #0F1419;
        --bg-header: #161B22;
        
        /* Text - Improved hierarchy */
        --text-primary: #F0F3F6;
        --text-secondary: #B1BAC4;
        --text-tertiary: #8B949E;
        --text-inverse: #0D1117;
        
        /* Borders - Subtle separators */
        --border-color: #30363D;
        --border-color-light: rgba(240, 243, 246, 0.1);
        --border-color-subtle: rgba(240, 243, 246, 0.05);
        
        /* Shadows - Layered depth */
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25);
        --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3);
        --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2);
        
        /* Primary - Consistent blue */
        --primary-color: #58A6FF;
        --primary-hover: #4493F8;
        --primary-light: #1F6FEB;
        
        /* Success */
        --success-color: #3FB950;
        --success-bg: rgba(63, 185, 80, 0.15);
        
        /* Error */
        --error-color: #F85149;
        --error-bg: rgba(248, 81, 73, 0.15);
        
        /* Warning */
        --warning-color: #D29922;
        --warning-bg: rgba(210, 153, 34, 0.15);
        
        /* Soft Tints for Cards (2-6% opacity) */
        --tint-blue: rgba(88, 166, 255, 0.04);
        --tint-blue-strong: rgba(88, 166, 255, 0.06);
        --tint-green: rgba(63, 185, 80, 0.04);
        --tint-green-strong: rgba(63, 185, 80, 0.06);
        --tint-amber: rgba(210, 153, 34, 0.04);
        --tint-amber-strong: rgba(210, 153, 34, 0.06);
        --tint-neutral: rgba(240, 243, 246, 0.03);
        --tint-neutral-strong: rgba(240, 243, 246, 0.05);
    }

    code {
        font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
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
    
    /* Subtle neutral tint for content area */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--tint-neutral);
        pointer-events: none;
        z-index: 0;
    }
    
    /* Subtle texture for depth */
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            radial-gradient(circle at 20% 30%, rgba(88, 166, 255, 0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(88, 166, 255, 0.015) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
    }
    
    /* Ensure content is above tints */
    > * {
        position: relative;
        z-index: 1;
    }
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
            <AuthProvider>
                <PageProvider initialPage={initialPage}>
                    <GlobalStyle />
                    <StoreAppLayout />
                </PageProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}


