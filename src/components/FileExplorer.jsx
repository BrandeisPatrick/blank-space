import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getTheme } from '../styles/theme';

export const FileExplorer = ({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createValue, setCreateValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hoveredFile, setHoveredFile] = useState(null);

  const handleFileSelect = (filePath) => {
    onFileSelect(filePath);
  };

  const handleCreateNew = () => {
    setShowCreateDialog(true);
    setCreateValue('');
  };

  const confirmCreate = () => {
    if (createValue.trim() && onFileCreate) {
      const filename = createValue.trim();
      onFileCreate(filename, '');
      setShowCreateDialog(false);
      setCreateValue('');
    }
  };

  const cancelCreate = () => {
    setShowCreateDialog(false);
    setCreateValue('');
  };

  const handleDeleteClick = (e, filename) => {
    e.stopPropagation();
    setDeleteTarget(filename);
  };

  const confirmDelete = () => {
    if (deleteTarget && onFileDelete) {
      onFileDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };


  const fileList = Object.keys(files);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.bg.primary,
      borderRight: `1px solid ${theme.colors.bg.border}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.bg.border}`,
        backgroundColor: theme.colors.bg.secondary,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
        }}>
          Explorer
        </span>
        <button
          onClick={handleCreateNew}
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
          title="New File"
        >
          +
        </button>
      </div>

      {/* File List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: theme.spacing.sm,
      }}>
        {fileList.length === 0 ? (
          <div style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.fontSize.sm,
          }}>
            No files yet
          </div>
        ) : (
          fileList.map((filePath) => (
            <div
              key={filePath}
              onClick={() => handleFileSelect(filePath)}
              onMouseEnter={() => setHoveredFile(filePath)}
              onMouseLeave={() => setHoveredFile(null)}
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                cursor: 'pointer',
                borderRadius: theme.radius.sm,
                fontSize: theme.typography.fontSize.sm,
                color: activeFile === filePath ? theme.colors.accent.primary : theme.colors.text.primary,
                backgroundColor: activeFile === filePath ? theme.colors.bg.hover : hoveredFile === filePath ? theme.colors.bg.secondary : 'transparent',
                transition: `all ${theme.animation.fast}`,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: '2px',
                fontWeight: activeFile === filePath ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {filePath}
              </span>
              {hoveredFile === filePath && (
                <button
                  onClick={(e) => handleDeleteClick(e, filePath)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.colors.text.tertiary,
                    cursor: 'pointer',
                    padding: '2px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: `all ${theme.animation.fast}`,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.text.tertiary;
                  }}
                  title="Delete file"
                >
                  ×
                </button>
              )}
              {activeFile === filePath && hoveredFile !== filePath && (
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: theme.colors.accent.primary,
                  flexShrink: 0,
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.bg.border}`,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            minWidth: '300px',
          }}>
            <h3 style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}>
              Create New File
            </h3>
            <input
              type="text"
              value={createValue}
              onChange={(e) => setCreateValue(e.target.value)}
              placeholder="Enter file name (e.g., utils.js)"
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `2px solid ${theme.colors.bg.border}`,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.bg.secondary,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.md,
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmCreate();
                } else if (e.key === 'Escape') {
                  cancelCreate();
                }
              }}
              autoFocus
            />
            <div style={{
              display: 'flex',
              gap: theme.spacing.sm,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={cancelCreate}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  border: `1px solid ${theme.colors.bg.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.bg.secondary,
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
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
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                disabled={!createValue.trim()}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  border: `1px solid ${theme.colors.bg.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: createValue.trim() ? theme.colors.accent.primary : theme.colors.bg.tertiary,
                  color: 'white',
                  cursor: createValue.trim() ? 'pointer' : 'not-allowed',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
                  transition: `opacity ${theme.animation.fast}`,
                  opacity: createValue.trim() ? 1 : 0.5,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.bg.border}`,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            minWidth: '350px',
          }}>
            <h3 style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}>
              Delete File
            </h3>
            <p style={{
              margin: `0 0 ${theme.spacing.lg} 0`,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.lineHeight.relaxed,
            }}>
              Are you sure you want to delete <strong style={{ color: theme.colors.text.primary }}>{deleteTarget}</strong>? This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: theme.spacing.sm,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  border: `1px solid ${theme.colors.bg.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.bg.secondary,
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
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
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  border: `1px solid ${theme.colors.bg.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: '#dc2626',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.sans,
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
