import { createContext, useContext, useState, useEffect } from 'react';

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
  const [artifacts, setArtifacts] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('vibe_artifacts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Allow empty state
        return parsed;
      } catch (e) {
        console.error('Failed to parse artifacts from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  const [activeArtifactId, setActiveArtifactId] = useState(() => {
    const saved = localStorage.getItem('vibe_active_artifact_id');
    return saved || artifacts[0]?.id || null;
  });

  // Save to localStorage whenever artifacts change
  useEffect(() => {
    localStorage.setItem('vibe_artifacts', JSON.stringify(artifacts));
  }, [artifacts]);

  // Save active artifact ID
  useEffect(() => {
    if (activeArtifactId) {
      localStorage.setItem('vibe_active_artifact_id', activeArtifactId);
    }
  }, [activeArtifactId]);

  // Get active artifact (can be null if no artifacts)
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || null;

  // Create new artifact
  const createArtifact = (name = 'Untitled Project', files = null) => {
    const newArtifact = {
      id: generateArtifactId(),
      name,
      files: files || createEmptyArtifact().files,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setArtifacts(prev => [...prev, newArtifact]);
    setActiveArtifactId(newArtifact.id);
    return newArtifact.id;
  };

  // Update artifact
  const updateArtifact = (id, updates) => {
    setArtifacts(prev => prev.map(artifact =>
      artifact.id === id
        ? { ...artifact, ...updates, updatedAt: Date.now() }
        : artifact
    ));
  };

  // Update artifact files
  const updateArtifactFiles = (id, files) => {
    updateArtifact(id, { files });
  };

  // Rename artifact
  const renameArtifact = (id, newName) => {
    updateArtifact(id, { name: newName });
  };

  // Delete artifact
  const deleteArtifact = (id) => {
    setArtifacts(prev => prev.filter(a => a.id !== id));

    // If deleting active artifact, switch to another or null
    if (id === activeArtifactId) {
      const remaining = artifacts.filter(a => a.id !== id);
      if (remaining.length > 0) {
        setActiveArtifactId(remaining[0].id);
      } else {
        setActiveArtifactId(null);
      }
    }
  };

  // Load artifact (switch active)
  const loadArtifact = (id) => {
    const artifact = artifacts.find(a => a.id === id);
    if (artifact) {
      setActiveArtifactId(id);
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
      setArtifacts(prev => [...prev, newArtifact]);
      setActiveArtifactId(newArtifact.id);
      return newArtifact.id;
    }
  };

  // Clear all artifacts
  const clearAllArtifacts = () => {
    setArtifacts([]);
    setActiveArtifactId(null);
  };

  const value = {
    artifacts,
    activeArtifact,
    activeArtifactId,
    createArtifact,
    updateArtifact,
    updateArtifactFiles,
    renameArtifact,
    deleteArtifact,
    loadArtifact,
    duplicateArtifact,
    clearAllArtifacts
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
