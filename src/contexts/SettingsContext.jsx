import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_COLOR_PALETTE } from '../services/stylePresets/colorPalettes';
import { DEFAULT_UI_STYLE } from '../services/stylePresets/uiStyles';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // UI state for settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // AI Generation Style settings (persisted to localStorage)
  const [aiColorPalette, setAIColorPalette] = useLocalStorage('aiColorPalette', DEFAULT_COLOR_PALETTE);
  const [aiUIStyle, setAIUIStyle] = useLocalStorage('aiUIStyle', DEFAULT_UI_STYLE);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // UI state
      isSettingsOpen,
      openSettings,
      closeSettings,
      // AI Generation Style settings
      aiColorPalette,
      setAIColorPalette,
      aiUIStyle,
      setAIUIStyle,
    }),
    [isSettingsOpen, openSettings, closeSettings, aiColorPalette, setAIColorPalette, aiUIStyle, setAIUIStyle]
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
