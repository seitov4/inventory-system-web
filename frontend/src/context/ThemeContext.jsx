import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Helper function to get system theme
const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const THEMES = ['light', 'dark', 'system'];

const resolveTheme = (theme, systemTheme) => {
    if (theme === 'system') {
        return systemTheme;
    }
    return theme === 'dark' ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return THEMES.includes(saved) ? saved : 'light';
    });

    const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const resolvedTheme = resolveTheme(theme, systemTheme);

        root.setAttribute('data-theme', resolvedTheme);
        body.setAttribute('data-theme', resolvedTheme);

        root.classList.remove('theme-light', 'theme-dark', 'theme-system');
        body.classList.remove('theme-light', 'theme-dark', 'theme-system');
        root.classList.add(`theme-${theme}`);
        body.classList.add(`theme-${theme}`);
    }, [theme, systemTheme]);

    // Listen to system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (event) => {
            setSystemTheme(event.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const changeTheme = (newTheme) => {
        setTheme(THEMES.includes(newTheme) ? newTheme : 'light');
    };

    const value = {
        theme,
        resolvedTheme: resolveTheme(theme, systemTheme),
        changeTheme,
        systemTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


