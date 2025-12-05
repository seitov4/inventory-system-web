import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem("theme");
        if (saved) return saved;

        // Проверяем системную тему
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    });

    const [systemTheme, setSystemTheme] = useState(() => {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });

    useEffect(() => {
        // Сохраняем тему в localStorage
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        // Применяем тему к body
        const root = document.documentElement;
        const body = document.body;

        // Удаляем все классы тем
        root.classList.remove("theme-light", "theme-dark", "theme-system");
        body.classList.remove("theme-light", "theme-dark", "theme-system");

        let effectiveTheme = theme;
        if (theme === "system") {
            effectiveTheme = systemTheme;
        }

        // Добавляем класс текущей темы
        root.classList.add(`theme-${effectiveTheme}`);
        body.classList.add(`theme-${effectiveTheme}`);

        // Устанавливаем data-атрибут для удобства
        root.setAttribute("data-theme", effectiveTheme);
    }, [theme, systemTheme]);

    useEffect(() => {
        // Отслеживаем изменения системной темы
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        
        const handleChange = (e) => {
            const newSystemTheme = e.matches ? "dark" : "light";
            setSystemTheme(newSystemTheme);
        };

        // Слушаем изменения
        mediaQuery.addEventListener("change", handleChange);

        return () => {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);

    const changeTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const value = {
        theme,
        changeTheme,
        systemTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

