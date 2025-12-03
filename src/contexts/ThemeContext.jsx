import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { themePresets, DEFAULT_THEME } from '../components/wallpaper/presets/wallpaperPresets';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Persisted theme selection
  const [theme, setThemeState] = useLocalStorage('theme', DEFAULT_THEME);

  // Get current theme preset
  const currentTheme = themePresets[theme] || themePresets[DEFAULT_THEME];

  // Derive mode from theme's isDark property
  const mode = currentTheme.isDark ? 'dark' : 'light';

  // Update theme
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
  }, [setThemeState]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      mode,
      theme,
      setTheme,
      currentTheme,
      themePresets,
    }),
    [mode, theme, setTheme, currentTheme]
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
