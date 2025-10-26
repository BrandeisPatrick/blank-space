import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { VersionControl } from '../services/utils/versionControl/VersionControl';

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

  // Version control for each artifact (stored by artifact ID)
  const versionControlRef = useRef({});

  // Get or create version control instance for an artifact
  const getVersionControlForArtifact = (artifactId) => {
    if (!versionControlRef.current[artifactId]) {
      versionControlRef.current[artifactId] = new VersionControl({
        maxHistoryPerFile: 50,
        maxSnapshots: 20
      });
    }
    return versionControlRef.current[artifactId];
  };

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

        // Validate parsedArtifacts is an array
        if (!Array.isArray(parsedArtifacts)) {
          console.warn('Invalid artifacts data in localStorage (not an array). Resetting.');
          setArtifacts([]);
          setActiveArtifactId(null);
          return;
        }

        setArtifacts(parsedArtifacts);

        if (activeId && parsedArtifacts.some(a => a && a.id === activeId)) {
          setActiveArtifactId(activeId);
        } else if (parsedArtifacts.length > 0) {
          setActiveArtifactId(parsedArtifacts[0]?.id || null);
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

  // Update artifact's chat history
  const updateChatHistory = (id, chatHistory) => {
    updateArtifact(id, { chatHistory });
  };

  // Create new artifact
  const createArtifact = async (name = 'Untitled Project', files = null) => {
    // Guest mode: Create artifact in localStorage
    if (!user) {
      const newArtifact = {
        id: generateArtifactId(),
        name,
        files: files || {},
        chatHistory: [],
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
          chatHistory: [],
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
  const updateArtifactFiles = (id, files, message = 'File modified') => {
    // DEBUG: Log artifact file updates
    console.log('🗄️  updateArtifactFiles called');
    console.log('   Artifact ID:', id);
    console.log('   Files being saved:', Object.keys(files));
    console.log('   Total file count:', Object.keys(files).length);

    // Get version control for this artifact
    const versionControl = getVersionControlForArtifact(id);

    // Get current artifact to check what changed
    const currentArtifact = artifacts.find(a => a.id === id);

    // Record changes in version control for each modified file
    if (currentArtifact) {
      Object.entries(files).forEach(([filename, code]) => {
        const oldCode = currentArtifact.files[filename];
        // Only record if file actually changed
        if (oldCode !== code) {
          versionControl.recordChange(filename, code, message);
          console.log(`📝 Recorded version: ${filename}`);
        }
      });
    } else {
      // New artifact, record all files
      Object.entries(files).forEach(([filename, code]) => {
        versionControl.recordChange(filename, code, 'Initial version');
      });
    }

    // Optimistically update UI immediately
    setArtifacts(prev => {
      const updated = prev.map(artifact =>
        artifact.id === id
          ? { ...artifact, files, updatedAt: new Date().toISOString() }
          : artifact
      );
      console.log('   ✓ Artifact state updated (optimistic)');
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
        chatHistory: [], // Start with empty chat history for duplicates
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
  const clearAllArtifacts = async () => {
    // Guest mode: Clear localStorage only
    if (!user) {
      setArtifacts([]);
      setActiveArtifactId(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ARTIFACT_KEY);
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

  // ==================== VERSION CONTROL METHODS ====================

  // Undo last change for active file
  const undoFileChange = (filename) => {
    if (!activeArtifactId) return null;

    const versionControl = getVersionControlForArtifact(activeArtifactId);
    const result = versionControl.undo(filename);

    if (result) {
      // Update artifact files with previous version
      const artifact = artifacts.find(a => a.id === activeArtifactId);
      if (artifact) {
        const updatedFiles = {
          ...artifact.files,
          [filename]: result.code
        };
        updateArtifactFiles(activeArtifactId, updatedFiles, `Undo: ${result.message}`);
      }
    }

    return result;
  };

  // Redo last undone change for active file
  const redoFileChange = (filename) => {
    if (!activeArtifactId) return null;

    const versionControl = getVersionControlForArtifact(activeArtifactId);
    const result = versionControl.redo(filename);

    if (result) {
      // Update artifact files with next version
      const artifact = artifacts.find(a => a.id === activeArtifactId);
      if (artifact) {
        const updatedFiles = {
          ...artifact.files,
          [filename]: result.code
        };
        updateArtifactFiles(activeArtifactId, updatedFiles, `Redo: ${result.message}`);
      }
    }

    return result;
  };

  // Check if undo is available
  const canUndoFile = (filename) => {
    if (!activeArtifactId) return false;
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.canUndo(filename);
  };

  // Check if redo is available
  const canRedoFile = (filename) => {
    if (!activeArtifactId) return false;
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.canRedo(filename);
  };

  // Create named snapshot
  const createSnapshot = (label) => {
    if (!activeArtifactId) return null;

    const artifact = artifacts.find(a => a.id === activeArtifactId);
    if (!artifact) return null;

    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.createSnapshot(artifact.files, label);
  };

  // Restore from snapshot
  const restoreSnapshot = (snapshotId) => {
    if (!activeArtifactId) return null;

    const versionControl = getVersionControlForArtifact(activeArtifactId);
    const result = versionControl.restoreSnapshot(snapshotId);

    if (result) {
      updateArtifactFiles(activeArtifactId, result.files, `Restored snapshot: ${result.label}`);
    }

    return result;
  };

  // Get snapshots for active artifact
  const getSnapshots = () => {
    if (!activeArtifactId) return [];
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.getSnapshots();
  };

  // Delete snapshot
  const deleteSnapshot = (snapshotId) => {
    if (!activeArtifactId) return false;
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.deleteSnapshot(snapshotId);
  };

  // Get file history
  const getFileHistory = (filename, limit = 10) => {
    if (!activeArtifactId) return null;
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.getFileHistory(filename, limit);
  };

  // Get timeline for all files
  const getTimeline = (limit = 20) => {
    if (!activeArtifactId) return [];
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.getTimeline(limit);
  };

  // Get diff between versions
  const getDiff = (filename, fromVersion = null, toVersion = null) => {
    if (!activeArtifactId) return null;
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.getDiff(filename, fromVersion, toVersion);
  };

  // Get version control stats
  const getVersionControlStats = () => {
    if (!activeArtifactId) return null;
    const versionControl = getVersionControlForArtifact(activeArtifactId);
    return versionControl.getStats();
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
      deleteArtifact,
      loadArtifact,
      duplicateArtifact,
      clearAllArtifacts,
      refreshArtifacts: loadArtifactsFromAPI,
      // Version control methods
      undoFileChange,
      redoFileChange,
      canUndoFile,
      canRedoFile,
      createSnapshot,
      restoreSnapshot,
      getSnapshots,
      deleteSnapshot,
      getFileHistory,
      getTimeline,
      getDiff,
      getVersionControlStats,
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
      deleteArtifact,
      loadArtifact,
      duplicateArtifact,
      clearAllArtifacts,
      loadArtifactsFromAPI,
      undoFileChange,
      redoFileChange,
      canUndoFile,
      canRedoFile,
      createSnapshot,
      restoreSnapshot,
      getSnapshots,
      deleteSnapshot,
      getFileHistory,
      getTimeline,
      getDiff,
      getVersionControlStats,
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
