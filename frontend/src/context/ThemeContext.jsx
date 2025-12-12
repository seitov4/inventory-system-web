import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const [systemTheme, setSystemTheme] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;

        root.classList.remove('theme-light', 'theme-dark', 'theme-system');
        body.classList.remove('theme-light', 'theme-dark', 'theme-system');

        const effectiveTheme = theme === 'system' ? systemTheme : theme;

        root.classList.add(`theme-${effectiveTheme}`);
        body.classList.add(`theme-${effectiveTheme}`);
        root.setAttribute('data-theme', effectiveTheme);
    }, [theme, systemTheme]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (event) => {
            setSystemTheme(event.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const changeTheme = (newTheme) => setTheme(newTheme);

    const value = {
        theme,
        changeTheme,
        systemTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


