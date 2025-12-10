import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_COLOR_PALETTE } from '../services/stylePresets/colorPalettes';
import { DEFAULT_UI_STYLE } from '../services/stylePresets/uiStyles';
import { useAuth } from './AuthContext';
import { useUserProfile } from './UserProfileContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const { profile, updateSettings } = useUserProfile();

  // UI state for settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // UI state for auth modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // AI Generation Style settings (persisted to localStorage for guests)
  const [localAIColorPalette, setLocalAIColorPalette] = useLocalStorage('aiColorPalette', DEFAULT_COLOR_PALETTE);
  const [localAIUIStyle, setLocalAIUIStyle] = useLocalStorage('aiUIStyle', DEFAULT_UI_STYLE);

  // Sync profile settings to localStorage when profile loads
  useEffect(() => {
    if (user && profile?.settings) {
      // Override localStorage with Firestore settings for authenticated users
      if (profile.settings.aiColorPalette) {
        setLocalAIColorPalette(profile.settings.aiColorPalette);
      }
      if (profile.settings.aiUIStyle) {
        setLocalAIUIStyle(profile.settings.aiUIStyle);
      }
    }
  }, [user, profile?.settings?.aiColorPalette, profile?.settings?.aiUIStyle]);

  // Get current values (prefer profile settings for authenticated users)
  const aiColorPalette = user && profile?.settings?.aiColorPalette
    ? profile.settings.aiColorPalette
    : localAIColorPalette;

  const aiUIStyle = user && profile?.settings?.aiUIStyle
    ? profile.settings.aiUIStyle
    : localAIUIStyle;

  // Set color palette (syncs to Firestore for authenticated users)
  const setAIColorPalette = useCallback((value) => {
    setLocalAIColorPalette(value);
    if (user) {
      updateSettings({ aiColorPalette: value });
    }
  }, [user, updateSettings, setLocalAIColorPalette]);

  // Set UI style (syncs to Firestore for authenticated users)
  const setAIUIStyle = useCallback((value) => {
    setLocalAIUIStyle(value);
    if (user) {
      updateSettings({ aiUIStyle: value });
    }
  }, [user, updateSettings, setLocalAIUIStyle]);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // UI state
      isSettingsOpen,
      openSettings,
      closeSettings,
      // Auth modal state
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      // AI Generation Style settings
      aiColorPalette,
      setAIColorPalette,
      aiUIStyle,
      setAIUIStyle,
    }),
    [isSettingsOpen, openSettings, closeSettings, isAuthModalOpen, openAuthModal, closeAuthModal, aiColorPalette, setAIColorPalette, aiUIStyle, setAIUIStyle]
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
