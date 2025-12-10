/**
 * UserProfileContext - User Profile State Management
 * Manages user profile data and syncs settings to Firestore
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = useCallback(async (url, options = {}) => {
    try {
      const token = await getIdToken();
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        const errorMessage = errorData?.message || errorData?.error || 'API request failed';
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }, [getIdToken]);

  // Load profile when user logs in
  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      // Clear profile when logged out
      setProfile(null);
    }
  }, [user]);

  // Load user profile from API
  const loadProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest('/api/user/profile');
      setProfile(data.profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user, makeAuthenticatedRequest]);

  // Update profile fields (displayName, bio, photoURL)
  const updateProfile = useCallback(async (updates) => {
    if (!user) return;

    setError(null);

    // Optimistically update UI
    setProfile(prev => prev ? { ...prev, ...updates } : null);

    try {
      const data = await makeAuthenticatedRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setProfile(data.profile);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      // Revert by reloading
      await loadProfile();
      return false;
    }
  }, [user, makeAuthenticatedRequest, loadProfile]);

  // Update settings (theme, aiColorPalette, aiUIStyle)
  const updateSettings = useCallback(async (settingsUpdates) => {
    if (!user) return;

    setError(null);

    // Optimistically update UI
    setProfile(prev => prev ? {
      ...prev,
      settings: { ...prev.settings, ...settingsUpdates }
    } : null);

    try {
      const data = await makeAuthenticatedRequest('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ settings: settingsUpdates }),
      });
      setProfile(data.profile);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.message);
      // Revert by reloading
      await loadProfile();
      return false;
    }
  }, [user, makeAuthenticatedRequest, loadProfile]);

  // Delete user account data (Firestore only - Firebase Auth handled separately)
  const deleteAccountData = useCallback(async () => {
    if (!user) return false;

    setError(null);

    try {
      await makeAuthenticatedRequest('/api/user/delete', {
        method: 'DELETE',
      });
      setProfile(null);
      return true;
    } catch (error) {
      console.error('Error deleting account data:', error);
      setError(error.message);
      return false;
    }
  }, [user, makeAuthenticatedRequest]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      profile,
      loading,
      error,
      loadProfile,
      updateProfile,
      updateSettings,
      deleteAccountData,
      clearError,
    }),
    [profile, loading, error, loadProfile, updateProfile, updateSettings, deleteAccountData, clearError]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
