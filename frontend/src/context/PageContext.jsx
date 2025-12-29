// context/PageContext.jsx
import { createContext, useState, useContext } from "react";

const PageContext = createContext();

export const PageProvider = ({ children, initialPage = "landing" }) => {
    const [activePage, setActivePage] = useState(initialPage);

    // Helper function to check if current page requires sidebar
    const needsSidebar = () => {
        const pagesWithSidebar = [
            "dashboard",
            "products",
            "stockIn",
            "pos",
            "sales",
            "warehouse",
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
