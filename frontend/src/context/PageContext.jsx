// context/PageContext.jsx
import { createContext, useContext, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const PageContext = createContext();

// Map canonical page keys to /app paths
const pageToPath = (page) => {
    if (!page || page === "landing") return "/app";
    return `/app/${page}`;
};

const pathToPage = (pathname) => {
    // Expect paths like /app, /app/dashboard, /app/products
    if (!pathname) return "landing";
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "app") return "landing";
    if (parts[1] === "reconciliation") return "dashboard";
    return parts[1] || "landing";
};

export const PageProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const activePage = useMemo(() => pathToPage(location.pathname), [location.pathname]);

    const setActivePage = (page) => {
        const target = pageToPath(page);
        // Preserve full navigation semantics (push)
        navigate(target);
    };

    // Helper function to check if current page requires sidebar
    const needsSidebar = () => {
        const pagesWithSidebar = [
            "dashboard",
            "products",
            "stockIn",
            "pos",
            "sales",
            "forecast",
            "warehouse",
            "reports",
            "movements",
            "notifications",
            "addEmployee",
            "settings",
        ];
        return pagesWithSidebar.includes(activePage);
    };

    return (
        <PageContext.Provider value={{ activePage, setActivePage, needsSidebar }}>
            {children}
        </PageContext.Provider>
    );
};

export const usePage = () => useContext(PageContext);
