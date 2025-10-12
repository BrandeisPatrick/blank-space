import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useArtifacts } from '../contexts/ArtifactContext';
import { getTheme } from '../styles/theme';
import { EditIcon, CopyIcon, TrashIcon } from './icons';

export const ArtifactSidebar = ({ isOpen, onClose, onNewArtifact }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const {
    artifacts,
    activeArtifactId,
    createArtifact,
    loadArtifact,
    deleteArtifact,
    duplicateArtifact,
    renameArtifact,
    clearAllArtifacts
  } = useArtifacts();

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleRename = (id, currentName) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleRenameSave = (id) => {
    if (renameValue.trim()) {
      renameArtifact(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleNewArtifact = () => {
    onNewArtifact();
  };

  const handleClearAll = () => {
    if (confirm(`Delete all ${artifacts.length} artifact${artifacts.length > 1 ? 's' : ''}? This cannot be undone.`)) {
      clearAllArtifacts();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '320px',
          background: theme.colors.bg.primary,
          borderRight: `1px solid ${theme.colors.bg.border}`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme.shadows.lg,
          animation: 'slideInLeft 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: theme.spacing.lg,
            borderBottom: `1px solid ${theme.colors.bg.border}`,
            background: theme.colors.bg.secondary,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.md,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}>
              Artifacts
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.colors.bg.border}`,
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radius.md,
                transition: `opacity ${theme.animation.fast}`,
                opacity: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
          }}>
            <button
              onClick={handleNewArtifact}
              style={{
                flex: 1,
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.bg.border}`,
                color: theme.colors.text.primary,
                borderRadius: theme.radius.md,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.sm,
                transition: `opacity ${theme.animation.fast}`,
                opacity: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              New Artifact
            </button>

            {artifacts.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  flex: 1,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  background: 'transparent',
                  border: `1px solid ${theme.colors.bg.border}`,
                  color: theme.colors.text.secondary,
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: theme.spacing.sm,
                  transition: `opacity ${theme.animation.fast}`,
                  opacity: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Artifact List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.sm,
        }}>
          {artifacts.length === 0 ? (
            <div style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.fontSize.sm,
            }}>
              No artifacts yet. Create one to get started!
            </div>
          ) : (
            artifacts.map((artifact) => (
              <div
                key={artifact.id}
                style={{
                  marginBottom: theme.spacing.sm,
                  padding: theme.spacing.md,
                  background: theme.colors.bg.secondary,
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                  transition: `opacity ${theme.animation.fast}`,
                  border: `1px solid ${artifact.id === activeArtifactId
                    ? theme.colors.accent.primary
                    : theme.colors.bg.border}`,
                  opacity: 1,
                }}
                onClick={() => loadArtifact(artifact.id)}
                onMouseEnter={(e) => {
                  if (artifact.id !== activeArtifactId) {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (artifact.id !== activeArtifactId) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {/* Artifact Name */}
                {renamingId === artifact.id ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSave(artifact.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSave(artifact.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: theme.spacing.xs,
                      border: `1px solid ${theme.colors.accent.primary}`,
                      borderRadius: theme.radius.sm,
                      background: theme.colors.bg.primary,
                      color: theme.colors.text.primary,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      outline: 'none',
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.xs,
                  }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {artifact.name}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', gap: theme.spacing.xs }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleRename(artifact.id, artifact.name)}
                        title="Rename"
                        style={{
                          background: 'transparent',
                          border: `1px solid ${theme.colors.bg.border}`,
                          color: theme.colors.text.secondary,
                          cursor: 'pointer',
                          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                          borderRadius: theme.radius.md,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          fontFamily: theme.typography.fontFamily.sans,
                          display: 'flex',
                          alignItems: 'center',
                          transition: `opacity ${theme.animation.fast}`,
                          opacity: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <EditIcon size={16} color={theme.colors.text.secondary} />
                      </button>

                      <button
                        onClick={() => duplicateArtifact(artifact.id)}
                        title="Duplicate"
                        style={{
                          background: 'transparent',
                          border: `1px solid ${theme.colors.bg.border}`,
                          color: theme.colors.text.secondary,
                          cursor: 'pointer',
                          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                          borderRadius: theme.radius.md,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          fontFamily: theme.typography.fontFamily.sans,
                          display: 'flex',
                          alignItems: 'center',
                          transition: `opacity ${theme.animation.fast}`,
                          opacity: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <CopyIcon size={16} color={theme.colors.text.secondary} />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete "${artifact.name}"?`)) {
                            deleteArtifact(artifact.id);
                          }
                        }}
                        title="Delete"
                        style={{
                          background: 'transparent',
                          border: `1px solid ${theme.colors.bg.border}`,
                          color: theme.colors.text.secondary,
                          cursor: 'pointer',
                          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                          borderRadius: theme.radius.md,
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          fontFamily: theme.typography.fontFamily.sans,
                          display: 'flex',
                          alignItems: 'center',
                          transition: `opacity ${theme.animation.fast}`,
                          opacity: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        <TrashIcon size={16} color={theme.colors.text.secondary} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{Object.keys(artifact.files).length} files</span>
                  <span>{formatDate(artifact.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
