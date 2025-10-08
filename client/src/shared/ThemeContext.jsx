// src/shared/ThemeContext.jsx
import React, { createContext, useEffect, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('sidebarTheme') || 'blue');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Sauvegarde thème sidebar
  useEffect(() => {
    localStorage.setItem('sidebarTheme', theme);
  }, [theme]);

  // Mode sombre / clair
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personnalisé
export const useTheme = () => useContext(ThemeContext);