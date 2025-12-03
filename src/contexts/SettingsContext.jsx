import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // Persisted settings
  const [wallpaperPreset, setWallpaperPreset] = useLocalStorage('wallpaperPreset', 'lavender');

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const updateWallpaperPreset = useCallback((preset) => {
    setWallpaperPreset(preset);
  }, [setWallpaperPreset]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // Settings
      wallpaperPreset,
      updateWallpaperPreset,
      // UI state
      isSettingsOpen,
      openSettings,
      closeSettings,
    }),
    [wallpaperPreset, updateWallpaperPreset, isSettingsOpen, openSettings, closeSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
