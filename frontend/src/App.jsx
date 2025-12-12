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
import SalesPage from "./pages/Sales/SalesPage";
import WarehousePage from "./pages/Warehouse/WarehousePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AddEmployeePage from "./pages/AddEmployee/AddEmployeePage";

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

    /* Light Theme (Default) */
    :root,
    .theme-light {
        --bg-primary: #f8fafc;
        --bg-secondary: #ffffff;
        --bg-tertiary: #f1f5f9;
        --bg-hover: #f8fafc;
        
        --text-primary: #0f172a;
        --text-secondary: #475569;
        --text-tertiary: #64748b;
        --text-inverse: #ffffff;
        
        --border-color: #e2e8f0;
        --border-color-light: rgba(148, 163, 184, 0.2);
        
        --shadow-sm: 0 2px 4px rgba(15, 23, 42, 0.05);
        --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.05);
        --shadow-lg: 0 6px 20px rgba(15, 23, 42, 0.06);
        
        --primary-color: #0ea5e9;
        --primary-hover: #0284c7;
        --primary-light: #eff6ff;
        
        --success-color: #10b981;
        --success-bg: #ecfdf3;
        
        --error-color: #ef4444;
        --error-bg: #fef2f2;
        
        --warning-color: #f59e0b;
        --warning-bg: #fef3c7;
    }

    /* Dark Theme */
    .theme-dark {
        --bg-primary: #0f172a;
        --bg-secondary: #1e293b;
        --bg-tertiary: #334155;
        --bg-hover: #1e293b;
        
        --text-primary: #f1f5f9;
        --text-secondary: #cbd5e1;
        --text-tertiary: #94a3b8;
        --text-inverse: #0f172a;
        
        --border-color: #334155;
        --border-color-light: rgba(148, 163, 184, 0.15);
        
        --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 6px 20px rgba(0, 0, 0, 0.5);
        
        --primary-color: #38bdf8;
        --primary-hover: #0ea5e9;
        --primary-light: #1e3a5f;
        
        --success-color: #34d399;
        --success-bg: #064e3b;
        
        --error-color: #f87171;
        --error-bg: #7f1d1d;
        
        --warning-color: #fbbf24;
        --warning-bg: #78350f;
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
        case "sales":
            return <SalesPage />;
        case "warehouse":
            return <WarehousePage />;
        case "addEmployee":
            return <AddEmployeePage />;
        case "settings":
            return <SettingsPage />;
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
