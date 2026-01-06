import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';

const ArtifactContext = createContext();

// Generate unique artifact ID
const generateArtifactId = () => {
  const timestamp = Date.now();
  const random = crypto.randomUUID().substring(0, 7);
  return `artifact_${timestamp}_${random}`;
};

// Empty artifact template
const createEmptyArtifact = () => ({
  id: generateArtifactId(),
  name: 'Untitled Project',
  icon: 'app', // Default icon category
  files: {},
  chatHistory: [], // Each artifact has its own chat history
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const ArtifactProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const [artifacts, setArtifacts] = useState([]);
  const [activeArtifactId, setActiveArtifactId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use ref to persist timeout across renders without causing re-renders
  const updateFilesTimeoutRef = useRef(null);

  // Load artifacts from API (when authenticated) or sessionStorage (when guest)
  useEffect(() => {
    if (user) {
      loadArtifactsFromAPI();
    } else {
      // Load from sessionStorage for guest mode
      loadArtifactsFromLocalStorage();
    }
  }, [user]);

  // sessionStorage helpers for guest mode
  const STORAGE_KEY = 'guestArtifacts';
  const ACTIVE_ARTIFACT_KEY = 'guestActiveArtifactId';

  const loadArtifactsFromLocalStorage = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const activeId = sessionStorage.getItem(ACTIVE_ARTIFACT_KEY);

      if (stored) {
        const parsedArtifacts = JSON.parse(stored);

        // Validate parsedArtifacts is an array
        if (!Array.isArray(parsedArtifacts)) {
          setArtifacts([]);
          setActiveArtifactId(null);
          return;
        }

        setArtifacts(parsedArtifacts);

        // Only restore activeArtifactId if explicitly saved in sessionStorage
        // Don't auto-select first artifact to keep landing page clean
        if (activeId && parsedArtifacts.some(a => a && a.id === activeId)) {
          setActiveArtifactId(activeId);
        } else {
          setActiveArtifactId(null);
        }
      } else {
        setArtifacts([]);
        setActiveArtifactId(null);
      }
    } catch (error) {
      console.error('Error loading from sessionStorage:', error);
      setArtifacts([]);
      setActiveArtifactId(null);
    }
  };

  const saveArtifactsToLocalStorage = (artifactsToSave, activeId) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(artifactsToSave));
      if (activeId) {
        sessionStorage.setItem(ACTIVE_ARTIFACT_KEY, activeId);
      }
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  };

  // Helper function to make authenticated API calls
  const makeAuthenticatedRequest = async (url, options = {}) => {
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
        } catch (jsonError) {
          // If JSON parsing fails, use HTTP status text
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        // Safely extract error message with null checks
        const errorMessage =
          (errorData && typeof errorData === 'object' && (errorData.message || errorData.error)) ||
          'API request failed';
        throw new Error(errorMessage);
      }

      // Add error handling for successful response JSON parsing
      try {
        return await response.json();
      } catch (jsonError) {
        throw new Error('Failed to parse API response as JSON');
      }
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  // Load all artifacts from API
  const loadArtifactsFromAPI = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest('/api/artifacts');
      setArtifacts(data.artifacts || []);

      // Don't auto-select first artifact to keep landing page clean
      // Only set active artifact when explicitly requested by user
    } catch (error) {
      console.error('Error loading artifacts:', error);
      setError(error.message);
      // Fallback to empty array
      setArtifacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get active artifact (can be null if no artifacts)
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || null;

  // Update artifact's chat history
  const updateChatHistory = (id, chatHistory) => {
    updateArtifact(id, { chatHistory });
  };

  // Create new artifact
  const createArtifact = async (name = 'Untitled Project', files = null, chatHistory = [], icon = 'app') => {
    // Guest mode: Create artifact in sessionStorage
    if (!user) {
      const newArtifact = {
        id: generateArtifactId(),
        name,
        icon,
        files: files ?? {},
        chatHistory: chatHistory ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const updatedArtifacts = [...artifacts, newArtifact];
      setArtifacts(updatedArtifacts);
      setActiveArtifactId(newArtifact.id);
      saveArtifactsToLocalStorage(updatedArtifacts, newArtifact.id);

      return newArtifact.id;
    }

    // Authenticated mode: Create artifact via API
    setLoading(true);
    setError(null);

    try {
      const data = await makeAuthenticatedRequest('/api/artifacts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          icon,
          files: files ?? {},
          chatHistory: chatHistory ?? [],
        }),
      });

      const newArtifact = data.artifact;
      setArtifacts(prev => [...prev, newArtifact]);
      setActiveArtifactId(newArtifact.id);
      return newArtifact.id;
    } catch (error) {
      console.error('Error creating artifact:', error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update artifact
  const updateArtifact = async (id, updates) => {
    // Guest mode: Update artifact in sessionStorage
    if (!user) {
      const updatedArtifacts = artifacts.map(artifact =>
        artifact.id === id
          ? { ...artifact, ...updates, updatedAt: Date.now() }
          : artifact
      );
      setArtifacts(updatedArtifacts);
      saveArtifactsToLocalStorage(updatedArtifacts, activeArtifactId);
      return;
    }

    // Authenticated mode: Update artifact via API
    // Optimistically update UI
    setArtifacts(prev => prev.map(artifact =>
      artifact.id === id
        ? { ...artifact, ...updates, updatedAt: new Date().toISOString() }
        : artifact
    ));

    try {
      const data = await makeAuthenticatedRequest('/api/artifacts', {
        method: 'PUT',
        body: JSON.stringify({
          artifactId: id,
          updates,
        }),
      });

      // Update with server response
      setArtifacts(prev => prev.map(artifact =>
        artifact.id === id ? data.artifact : artifact
      ));
    } catch (error) {
      console.error('Error updating artifact:', error);
      setError(error.message);
      // Revert optimistic update by reloading
      await loadArtifactsFromAPI();
    }
  };

  // Update artifact files (with debouncing to reduce API calls)
  const updateArtifactFiles = (id, files) => {
    // Optimistically update UI immediately
    setArtifacts(prev => {
      const updated = prev.map(artifact =>
        artifact.id === id
          ? { ...artifact, files, updatedAt: new Date().toISOString() }
          : artifact
      );
      return updated;
    });

    // Debounce API call using ref to persist timeout
    if (updateFilesTimeoutRef.current) {
      clearTimeout(updateFilesTimeoutRef.current);
    }

    updateFilesTimeoutRef.current = setTimeout(() => {
      updateArtifact(id, { files });
      updateFilesTimeoutRef.current = null; // Clear ref after execution
    }, 2000); // Wait 2 seconds before saving
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateFilesTimeoutRef.current) {
        clearTimeout(updateFilesTimeoutRef.current);
      }
    };
  }, []);

  // Rename artifact
  const renameArtifact = (id, newName) => {
    updateArtifact(id, { name: newName });
  };

  // Update artifact icon
  const updateArtifactIcon = (id, icon) => {
    updateArtifact(id, { icon });
  };

  // Delete artifact
  const deleteArtifact = async (id) => {
    const remaining = artifacts.filter(a => a.id !== id);
    let newActiveId = activeArtifactId;

    // If deleting active artifact, switch to another or null
    if (id === activeArtifactId) {
      newActiveId = remaining.length > 0 ? remaining[0].id : null;
    }

    // Guest mode: Delete artifact from sessionStorage
    if (!user) {
      setArtifacts(remaining);
      setActiveArtifactId(newActiveId);
      saveArtifactsToLocalStorage(remaining, newActiveId);
      return;
    }

    // Authenticated mode: Delete artifact via API
    // Optimistically update UI
    const artifactToDelete = artifacts.find(a => a.id === id);
    setArtifacts(remaining);
    setActiveArtifactId(newActiveId);

    try {
      await makeAuthenticatedRequest(`/api/artifacts?id=${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting artifact:', error);
      setError(error.message);
      // Revert deletion by adding it back
      if (artifactToDelete) {
        setArtifacts(prev => [...prev, artifactToDelete]);
      }
    }
  };

  // Load artifact (switch active)
  const loadArtifact = (id) => {
    const artifact = artifacts.find(a => a.id === id);
    if (artifact) {
      setActiveArtifactId(id);
      // Save active artifact ID to sessionStorage for guests
      if (!user) {
        sessionStorage.setItem(ACTIVE_ARTIFACT_KEY, id);
      }
    }
  };

  // Duplicate artifact
  const duplicateArtifact = (id) => {
    const artifact = artifacts.find(a => a.id === id);
    if (artifact) {
      const newArtifact = {
        id: generateArtifactId(),
        name: `${artifact.name} (Copy)`,
        icon: artifact.icon || 'app', // Copy icon from original
        files: { ...artifact.files },
        chatHistory: [], // Start with empty chat history for duplicates
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const updatedArtifacts = [...artifacts, newArtifact];
      setArtifacts(updatedArtifacts);
      setActiveArtifactId(newArtifact.id);

      // Save to sessionStorage for guests
      if (!user) {
        saveArtifactsToLocalStorage(updatedArtifacts, newArtifact.id);
      }

      return newArtifact.id;
    }
  };

  // Clear all artifacts
  const clearAllArtifacts = async () => {
    // Guest mode: Clear sessionStorage only
    if (!user) {
      setArtifacts([]);
      setActiveArtifactId(null);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_ARTIFACT_KEY);
      return;
    }

    // Authenticated mode: Delete all artifacts from remote database
    const artifactIds = artifacts.map(a => a.id);

    // Optimistically clear UI
    setArtifacts([]);
    setActiveArtifactId(null);

    // Delete each artifact from database
    try {
      await Promise.all(
        artifactIds.map(id =>
          makeAuthenticatedRequest(`/api/artifacts/delete?id=${id}`, {
            method: 'DELETE',
          })
        )
      );
    } catch (error) {
      console.error('Error clearing all artifacts:', error);
      setError(error.message);
      // Reload artifacts to show actual state
      await loadArtifactsFromAPI();
    }
  };

  // Clear active artifact (useful for resetting to create new artifact)
  const clearActiveArtifact = () => {
    setActiveArtifactId(null);
    if (!user) {
      sessionStorage.removeItem(ACTIVE_ARTIFACT_KEY);
    }
  };

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({
      artifacts,
      activeArtifact,
      activeArtifactId,
      loading,
      error,
      createArtifact,
      updateArtifact,
      updateArtifactFiles,
      updateChatHistory,
      renameArtifact,
      updateArtifactIcon,
      deleteArtifact,
      loadArtifact,
      duplicateArtifact,
      clearActiveArtifact,
      clearAllArtifacts,
      refreshArtifacts: loadArtifactsFromAPI,
    }),
    [
      artifacts,
      activeArtifact,
      activeArtifactId,
      loading,
      error,
      createArtifact,
      updateArtifact,
      updateArtifactFiles,
      updateChatHistory,
      renameArtifact,
      updateArtifactIcon,
      deleteArtifact,
      loadArtifact,
      duplicateArtifact,
      clearAllArtifacts,
      loadArtifactsFromAPI,
    ]
  );

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};

export const useArtifacts = () => {
  const context = useContext(ArtifactContext);
  if (!context) {
    throw new Error('useArtifacts must be used within ArtifactProvider');
  }
  return context;
};
