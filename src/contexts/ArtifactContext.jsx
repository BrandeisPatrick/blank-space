import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ArtifactContext = createContext();

// Generate unique artifact ID
const generateArtifactId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `artifact_${timestamp}_${random}`;
};

// Empty artifact template
const createEmptyArtifact = () => ({
  id: generateArtifactId(),
  name: 'Untitled Project',
  files: {},
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export const ArtifactProvider = ({ children }) => {
  const { user, getIdToken } = useAuth();
  const [artifacts, setArtifacts] = useState([]);
  const [activeArtifactId, setActiveArtifactId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load artifacts from API (when authenticated) or localStorage (when guest)
  useEffect(() => {
    if (user) {
      loadArtifactsFromAPI();
    } else {
      // Load from localStorage for guest mode
      loadArtifactsFromLocalStorage();
    }
  }, [user]);

  // localStorage helpers for guest mode
  const STORAGE_KEY = 'guestArtifacts';
  const ACTIVE_ARTIFACT_KEY = 'guestActiveArtifactId';

  const loadArtifactsFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_ARTIFACT_KEY);

      if (stored) {
        const parsedArtifacts = JSON.parse(stored);
        setArtifacts(parsedArtifacts);

        if (activeId && parsedArtifacts.some(a => a.id === activeId)) {
          setActiveArtifactId(activeId);
        } else if (parsedArtifacts.length > 0) {
          setActiveArtifactId(parsedArtifacts[0].id);
        }
      } else {
        setArtifacts([]);
        setActiveArtifactId(null);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setArtifacts([]);
      setActiveArtifactId(null);
    }
  };

  const saveArtifactsToLocalStorage = (artifactsToSave, activeId) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(artifactsToSave));
      if (activeId) {
        localStorage.setItem(ACTIVE_ARTIFACT_KEY, activeId);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
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
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'API request failed');
      }

      return await response.json();
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
      const data = await makeAuthenticatedRequest('/api/artifacts/list');
      setArtifacts(data.artifacts || []);

      // Set active artifact to first one if none selected
      if (!activeArtifactId && data.artifacts.length > 0) {
        setActiveArtifactId(data.artifacts[0].id);
      }
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

  // Create new artifact
  const createArtifact = async (name = 'Untitled Project', files = null) => {
    // Guest mode: Create artifact in localStorage
    if (!user) {
      const newArtifact = {
        id: generateArtifactId(),
        name,
        files: files || {},
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
      const data = await makeAuthenticatedRequest('/api/artifacts/create', {
        method: 'POST',
        body: JSON.stringify({
          name,
          files: files || {},
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
    // Guest mode: Update artifact in localStorage
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
      const data = await makeAuthenticatedRequest('/api/artifacts/update', {
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
  let updateFilesTimeout = null;
  const updateArtifactFiles = (id, files) => {
    // Optimistically update UI immediately
    setArtifacts(prev => prev.map(artifact =>
      artifact.id === id
        ? { ...artifact, files, updatedAt: new Date().toISOString() }
        : artifact
    ));

    // Debounce API call
    if (updateFilesTimeout) {
      clearTimeout(updateFilesTimeout);
    }

    updateFilesTimeout = setTimeout(() => {
      updateArtifact(id, { files });
    }, 2000); // Wait 2 seconds before saving
  };

  // Rename artifact
  const renameArtifact = (id, newName) => {
    updateArtifact(id, { name: newName });
  };

  // Delete artifact
  const deleteArtifact = async (id) => {
    const remaining = artifacts.filter(a => a.id !== id);
    let newActiveId = activeArtifactId;

    // If deleting active artifact, switch to another or null
    if (id === activeArtifactId) {
      newActiveId = remaining.length > 0 ? remaining[0].id : null;
    }

    // Guest mode: Delete artifact from localStorage
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
      await makeAuthenticatedRequest(`/api/artifacts/delete?id=${id}`, {
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
      // Save active artifact ID to localStorage for guests
      if (!user) {
        localStorage.setItem(ACTIVE_ARTIFACT_KEY, id);
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
        files: { ...artifact.files },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const updatedArtifacts = [...artifacts, newArtifact];
      setArtifacts(updatedArtifacts);
      setActiveArtifactId(newArtifact.id);

      // Save to localStorage for guests
      if (!user) {
        saveArtifactsToLocalStorage(updatedArtifacts, newArtifact.id);
      }

      return newArtifact.id;
    }
  };

  // Clear all artifacts
  const clearAllArtifacts = () => {
    setArtifacts([]);
    setActiveArtifactId(null);

    // Clear localStorage for guests
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ARTIFACT_KEY);
    }
  };

  const value = {
    artifacts,
    activeArtifact,
    activeArtifactId,
    loading,
    error,
    createArtifact,
    updateArtifact,
    updateArtifactFiles,
    renameArtifact,
    deleteArtifact,
    loadArtifact,
    duplicateArtifact,
    clearAllArtifacts,
    refreshArtifacts: loadArtifactsFromAPI,
  };

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
