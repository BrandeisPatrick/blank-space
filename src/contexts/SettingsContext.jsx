import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // UI state for settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // UI state
      isSettingsOpen,
      openSettings,
      closeSettings,
    }),
    [isSettingsOpen, openSettings, closeSettings]
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
