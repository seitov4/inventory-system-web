// context/PageContext.jsx
import { createContext, useState, useContext } from "react";

const PageContext = createContext();

export const PageProvider = ({ children }) => {
    const [activePage, setActivePage] = useState("landing");

    // Helper function to check if current page requires sidebar
    const needsSidebar = () => {
        const pagesWithSidebar = [
            "dashboard",
            "products",
            "sales",
            "warehouse",
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
