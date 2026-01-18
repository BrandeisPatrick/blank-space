import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useFileSystem } from '../../contexts/FileSystemContext';
import { useAuth } from '../../contexts/AuthContext';
import { getTheme } from '../../styles/theme';
import { EditIcon, TrashIcon } from '../icons';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export const ArtifactSidebar = ({ isOpen, onClose }) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const { user } = useAuth();
  const {
    projects,
    activeProjectSlug,
    loadProject,
    deleteProject,
    updateProjectMeta,
  } = useFileSystem();

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

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

  const handleRenameSave = (slug) => {
    if (renameValue.trim()) {
      updateProjectMeta(slug, { name: renameValue.trim() });
    }
    setRenamingId(null);
  };

  const handleClearAll = () => {
    setShowClearAllDialog(true);
  };

  const handleConfirmClearAll = () => {
    // Clear all projects - delete each one
    projects.forEach(p => deleteProject(p.slug));
    setShowClearAllDialog(false);
  };

  const handleCancelClearAll = () => {
    setShowClearAllDialog(false);
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

          {projects.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                width: '100%',
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

        {/* Artifact List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.sm,
        }}>
          {projects.length === 0 ? (
            <div style={{
              padding: theme.spacing.xl,
              textAlign: 'center',
              color: theme.colors.text.tertiary,
              fontSize: theme.typography.fontSize.sm,
            }}>
              No artifacts yet
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.slug}
                style={{
                  marginBottom: theme.spacing.sm,
                  padding: theme.spacing.md,
                  background: theme.colors.bg.secondary,
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                  transition: `opacity ${theme.animation.fast}`,
                  border: `1px solid ${project.slug === activeProjectSlug
                    ? theme.colors.accent.primary
                    : theme.colors.bg.border}`,
                  opacity: 1,
                }}
                onClick={() => loadProject(project.slug)}
                onMouseEnter={(e) => {
                  if (project.slug !== activeProjectSlug) {
                    e.currentTarget.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (project.slug !== activeProjectSlug) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {/* Project Name */}
                {renamingId === project.slug ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSave(project.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSave(project.slug);
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
                      {project.name}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', gap: theme.spacing.xs }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleRename(project.slug, project.name)}
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
                        onClick={() => {
                          if (confirm(`Delete "${project.name}"?`)) {
                            deleteProject(project.slug);
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
                  <span>{project.slug}</span>
                  <span>{formatDate(project.createdAt)}</span>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showClearAllDialog}
        title="Clear All Artifacts"
        message={
          user
            ? `Permanently delete all ${projects.length} artifact${projects.length > 1 ? 's' : ''} from the database? This cannot be undone.`
            : `Clear all ${projects.length} artifact${projects.length > 1 ? 's' : ''} from this session? This cannot be undone.`
        }
        onConfirm={handleConfirmClearAll}
        onCancel={handleCancelClearAll}
        confirmText="Delete All"
        cancelText="Cancel"
      />
    </>
  );
};
