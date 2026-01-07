import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Persisted mode: 'light' or 'dark'
  const [mode, setModeState] = useLocalStorage('themeMode', 'dark');

  // Update mode
  const setMode = useCallback((newMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);
    }
  }, [setModeState]);

  // Toggle between light and dark
  const toggleMode = useCallback(() => {
    setModeState(prev => prev === 'dark' ? 'light' : 'dark');
  }, [setModeState]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
