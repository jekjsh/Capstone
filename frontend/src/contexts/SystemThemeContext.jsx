import { createContext, useContext, useEffect, useState } from 'react';
import { systemThemeAPI } from '../services/api';

const SystemThemeContext = createContext();

export const SystemThemeProvider = ({ children, initialTheme = null }) => {
  const [theme, setTheme] = useState(initialTheme);
  const [loading, setLoading] = useState(!initialTheme);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if no initialTheme was provided
    if (!initialTheme) {
      const fetchTheme = async () => {
        try {
          setLoading(true);
          const activeTheme = await systemThemeAPI.getActive();
          setTheme(activeTheme);
          
          // Update document title
          updateDocumentTitle(activeTheme);
          
          // Update CSS variables for sidebar color
          updateThemeColors(activeTheme);
        } catch (err) {
          console.error('Failed to fetch system theme:', err);
          setError(err);
          // Set default theme on error
          const defaultTheme = {
            sys_name: 'Record Keeping Management System',
            sys_abbr: 'RKMS',
            sys_logo: null,
            sys_backg: null,
            sidebar_color: '#3B82F6',
          };
          setTheme(defaultTheme);
          updateThemeColors(defaultTheme);
        } finally {
          setLoading(false);
        }
      };

      fetchTheme();
    } else {
      // If initialTheme is provided, apply it immediately
      updateDocumentTitle(initialTheme);
      updateThemeColors(initialTheme);
      setLoading(false);
    }
  }, [initialTheme]);

  const updateDocumentTitle = (activeTheme) => {
    if (activeTheme?.sys_abbr) {
      document.title = `${activeTheme.sys_abbr} RKMS`;
    }
  };

  const updateThemeColors = (activeTheme) => {
    if (activeTheme?.sidebar_color) {
      // Sidebar color is always a hex value now
      const sidebarColorHex = activeTheme.sidebar_color;
      document.documentElement.style.setProperty('--sidebar-color', sidebarColorHex);
    }
  };

  const refreshTheme = async () => {
    try {
      const activeTheme = await systemThemeAPI.getActive();
      setTheme(activeTheme);
      updateDocumentTitle(activeTheme);
      updateThemeColors(activeTheme);
    } catch (err) {
      console.error('Failed to refresh system theme:', err);
      setError(err);
    }
  };

  return (
    <SystemThemeContext.Provider value={{ theme, loading, error, refreshTheme }}>
      {children}
    </SystemThemeContext.Provider>
  );
};

export const useSystemTheme = () => {
  const context = useContext(SystemThemeContext);
  if (!context) {
    throw new Error('useSystemTheme must be used within SystemThemeProvider');
  }
  return context;
};
