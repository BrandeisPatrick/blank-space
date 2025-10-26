import { useState } from 'react';
import { useArtifacts } from '../../contexts/ArtifactContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getTheme } from '../../styles/theme';

/**
 * Version Control Toolbar
 *
 * Provides undo/redo/snapshot controls for file editing.
 * Displays inline with file tabs or as a floating toolbar.
 */
export const VersionControlToolbar = ({ activeFile, compact = false }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const {
    undoFileChange,
    redoFileChange,
    canUndoFile,
    canRedoFile,
    createSnapshot,
    getSnapshots,
    restoreSnapshot,
    deleteSnapshot,
    getFileHistory
  } = useArtifacts();

  const [showSnapshots, setShowSnapshots] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!activeFile) return null;

  const canUndo = canUndoFile(activeFile);
  const canRedo = canRedoFile(activeFile);

  const handleUndo = () => {
    const result = undoFileChange(activeFile);
    if (result) {
      console.log(`✅ Undone: ${activeFile} to version ${result.version}`);
    }
  };

  const handleRedo = () => {
    const result = redoFileChange(activeFile);
    if (result) {
      console.log(`✅ Redone: ${activeFile} to version ${result.version}`);
    }
  };

  const handleCreateSnapshot = () => {
    const label = prompt('Enter snapshot name:', `Checkpoint ${Date.now()}`);
    if (label) {
      const snapshot = createSnapshot(label);
      if (snapshot) {
        console.log(`📸 Snapshot created: ${snapshot.label}`);
        alert(`Snapshot "${snapshot.label}" created!`);
      }
    }
  };

  const handleShowSnapshots = () => {
    setShowSnapshots(!showSnapshots);
    setShowHistory(false);
  };

  const handleShowHistory = () => {
    setShowHistory(!showHistory);
    setShowSnapshots(false);
  };

  const snapshots = getSnapshots();
  const history = getFileHistory(activeFile, 10);

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center'
      }}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '4px 8px',
            background: canUndo ? theme.surface : theme.surfaceAlt,
            color: canUndo ? theme.text : theme.textMuted,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          ↶
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '4px 8px',
            background: canRedo ? theme.surface : theme.surfaceAlt,
            color: canRedo ? theme.text : theme.textMuted,
            border: `1px solid ${theme.border}`,
            borderRadius: '4px',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          ↷
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: theme.surface,
      borderBottom: `1px solid ${theme.border}`,
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        gap: '4px'
      }}>
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          style={{
            padding: '6px 12px',
            background: canUndo ? theme.primary : theme.surfaceAlt,
            color: canUndo ? 'white' : theme.textMuted,
            border: `1px solid ${canUndo ? theme.primary : theme.border}`,
            borderRadius: '4px',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          style={{
            padding: '6px 12px',
            background: canRedo ? theme.primary : theme.surfaceAlt,
            color: canRedo ? 'white' : theme.textMuted,
            border: `1px solid ${canRedo ? theme.primary : theme.border}`,
            borderRadius: '4px',
            cursor: canRedo ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ↷ Redo
        </button>
      </div>

      <div style={{
        width: '1px',
        height: '24px',
        background: theme.border
      }} />

      <button
        onClick={handleCreateSnapshot}
        title="Create Snapshot"
        style={{
          padding: '6px 12px',
          background: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📸 Snapshot
      </button>

      <button
        onClick={handleShowHistory}
        title="View History"
        style={{
          padding: '6px 12px',
          background: showHistory ? theme.primary : theme.surface,
          color: showHistory ? 'white' : theme.text,
          border: `1px solid ${showHistory ? theme.primary : theme.border}`,
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        📜 History ({history?.totalVersions || 0})
      </button>

      <button
        onClick={handleShowSnapshots}
        title="View Snapshots"
        style={{
          padding: '6px 12px',
          background: showSnapshots ? theme.primary : theme.surface,
          color: showSnapshots ? 'white' : theme.text,
          border: `1px solid ${showSnapshots ? theme.primary : theme.border}`,
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        💾 Snapshots ({snapshots.length})
      </button>

      {/* Snapshots Panel */}
      {showSnapshots && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '8px',
          marginTop: '4px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '300px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: theme.text }}>
            Snapshots
          </h3>
          {snapshots.length === 0 ? (
            <p style={{ color: theme.textMuted, fontSize: '12px' }}>
              No snapshots yet. Create one to save current state.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {snapshots.map(snapshot => (
                <div
                  key={snapshot.id}
                  style={{
                    padding: '8px',
                    background: theme.surfaceAlt,
                    borderRadius: '4px',
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: theme.text }}>
                        {snapshot.label}
                      </div>
                      <div style={{ fontSize: '11px', color: theme.textMuted }}>
                        {snapshot.fileCount} files • {new Date(snapshot.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          if (confirm(`Restore snapshot "${snapshot.label}"?`)) {
                            restoreSnapshot(snapshot.id);
                            setShowSnapshots(false);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: theme.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete snapshot "${snapshot.label}"?`)) {
                            deleteSnapshot(snapshot.id);
                          }
                        }}
                        style={{
                          padding: '4px 8px',
                          background: theme.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Panel */}
      {showHistory && history && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '8px',
          marginTop: '4px',
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '12px',
          minWidth: '350px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: theme.text }}>
            {activeFile} History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {history.versions.map(version => (
              <div
                key={version.version}
                style={{
                  padding: '8px',
                  background: version.isCurrent ? theme.primaryLight : theme.surfaceAlt,
                  borderRadius: '4px',
                  border: `1px solid ${version.isCurrent ? theme.primary : theme.border}`,
                  fontSize: '12px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: '500', color: theme.text }}>
                      v{version.version}
                    </span>
                    {version.isCurrent && (
                      <span style={{ marginLeft: '8px', color: theme.primary, fontSize: '11px' }}>
                        (current)
                      </span>
                    )}
                    <div style={{ color: theme.textMuted, fontSize: '11px', marginTop: '4px' }}>
                      {version.message}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: '10px' }}>
                      {new Date(version.timestamp).toLocaleString()} • {version.size} bytes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: theme.textMuted }}>
            Showing {history.versions.length} of {history.totalVersions} versions
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionControlToolbar;
