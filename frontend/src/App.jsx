import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { PageProvider, usePage } from "./context/PageContext";
import { ThemeProvider } from "./context/ThemeContext";

// Components
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Sidebar from "./components/Layout/Sidebar";

// Pages
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductsPage from "./pages/Products/ProductsPage";
import StockInPage from "./pages/StockIn/StockInPage";
import SalesPage from "./pages/Sales/SalesPage";
import WarehousePage from "./pages/Warehouse/WarehousePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AddEmployeePage from "./pages/AddEmployee/AddEmployeePage";
import POSPage from "./pages/POS/POSPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";

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
        /* Backgrounds */
        --bg-primary: #0B1220;
        --bg-secondary: #111827;
        --bg-tertiary: #1F2937;
        --bg-hover: #1F2937;
        
        /* Text */
        --text-primary: #E5E7EB;
        --text-secondary: #9CA3AF;
        --text-tertiary: #6B7280;
        --text-inverse: #0B1220;
        
        /* Borders */
        --border-color: #374151;
        --border-color-light: rgba(156, 163, 175, 0.2);
        
        /* Shadows */
        --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.5);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
        --shadow-lg: 0 6px 20px rgba(0, 0, 0, 0.7);
        
        /* Primary */
        --primary-color: #3B82F6;
        --primary-hover: #2563EB;
        --primary-light: #1E3A8A;
        
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
    display: ${props => props.$withSidebar ? 'grid' : 'block'};
    grid-template-columns: ${props => props.$withSidebar ? (props.$collapsed ? '64px' : '240px') + ' minmax(0, 1fr)' : '1fr'};
    min-height: calc(100vh - 120px);
    transition: grid-template-columns 0.3s ease;

    @media (max-width: 900px) {
        grid-template-columns: ${props => props.$withSidebar ? '200px minmax(0, 1fr)' : '1fr'};
    }

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
        display: block;
    }
`;

const MainContent = styled.main`
    flex: 1;
    background: var(--bg-primary);
`;

// ------------- PAGE RENDERER -------------
function PageRenderer() {
    const { activePage } = usePage();

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
        default:
            return <LandingPage />;
    }
}

// ------------- APP LAYOUT -------------
function AppLayout() {
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
                {showSidebar && (
                    <Sidebar onCollapseChange={setSidebarCollapsed} />
                )}
                <MainContent>
                    <PageRenderer />
                </MainContent>
            </AppBody>
            <Footer />
        </AppRoot>
    );
}

// ---------------- MAIN APP ----------------
export default function App() {
    return (
        <ThemeProvider>
            <PageProvider>
                <GlobalStyle />
                <AppLayout />
            </PageProvider>
        </ThemeProvider>
    );
}
