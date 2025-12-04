import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const AppStoreContext = createContext();

export const AppStoreProvider = ({ children }) => {
  // UI state for app store modal
  const [isAppStoreOpen, setIsAppStoreOpen] = useState(false);

  const openAppStore = useCallback(() => setIsAppStoreOpen(true), []);
  const closeAppStore = useCallback(() => setIsAppStoreOpen(false), []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // UI state
      isAppStoreOpen,
      openAppStore,
      closeAppStore,
    }),
    [isAppStoreOpen, openAppStore, closeAppStore]
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};
