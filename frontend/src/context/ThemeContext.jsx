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

// The store workspace now uses one fixed light enterprise theme.
// Older saved "dark" / "system" preferences are normalized to light.
const resolveTheme = () => {
    return 'light';
};

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage or default to the fixed light theme
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'light' ? saved : 'light';
    });

    const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const resolvedTheme = resolveTheme(theme);

        // Set data-theme attribute (source of truth)
        root.setAttribute('data-theme', resolvedTheme);
        body.setAttribute('data-theme', resolvedTheme);

        // Remove old classes (if any)
        root.classList.remove('theme-light', 'theme-dark', 'theme-system');
        body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    }, [theme]);

    // Listen to system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (event) => {
            setSystemTheme(event.matches ? 'dark' : 'light');
            // If current theme is 'system', re-apply
            const root = document.documentElement;
            const body = document.body;
            root.setAttribute('data-theme', 'light');
            body.setAttribute('data-theme', 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Save theme to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('theme', 'light');
    }, [theme]);

    const changeTheme = (newTheme) => {
        setTheme('light');
    };

    const value = {
        theme,
        changeTheme,
        systemTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


