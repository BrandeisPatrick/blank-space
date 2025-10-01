import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface FileExplorerProps {
  files: Record<string, string>
  activeFile: string
  onFileSelect: (filename: string) => void
  onFileCreate?: (filename: string, content: string) => void
  onFileRename?: (oldFilename: string, newFilename: string) => void
}

export const FileExplorer = ({
  files,
  activeFile,
  onFileSelect,
  onFileCreate,
  onFileRename: _onFileRename
}: FileExplorerProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [showCreateDialog, setShowCreateDialog] = useState<{
    visible: boolean
    type: 'file' | 'folder'
    parentPath: string
  }>({ visible: false, type: 'file', parentPath: '' })
  const [createValue, setCreateValue] = useState('')

  const handleFileSelect = (filePath: string) => {
    onFileSelect(filePath)
  }

  const handleCreateNew = (type: 'file' | 'folder') => {
    setShowCreateDialog({ visible: true, type, parentPath: '' })
    setCreateValue('')
  }

  const confirmCreate = () => {
    if (createValue.trim() && onFileCreate) {
      const filename = createValue.trim()
      onFileCreate(filename, '')
      setShowCreateDialog({ visible: false, type: 'file', parentPath: '' })
      setCreateValue('')
    }
  }

  const cancelCreate = () => {
    setShowCreateDialog({ visible: false, type: 'file', parentPath: '' })
    setCreateValue('')
  }

  // Simple file list (fallback implementation)
  const fileList = Object.keys(files)

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.bg.primary,
      borderRight: `1px solid ${theme.colors.border}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing.md,
        borderBottom: `1px solid ${theme.colors.border}`,
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
          Files
        </span>
        <div style={{ display: 'flex', gap: theme.spacing.xs }}>
          <button
            onClick={() => handleCreateNew('file')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              fontSize: theme.typography.fontSize.sm,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.tertiary
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="New File"
          >
            📄
          </button>
          <button
            onClick={() => handleCreateNew('folder')}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              fontSize: theme.typography.fontSize.sm,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.bg.tertiary
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="New Folder"
          >
            📁
          </button>
        </div>
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
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                cursor: 'pointer',
                borderRadius: theme.radius.sm,
                fontSize: theme.typography.fontSize.sm,
                color: activeFile === filePath ? theme.colors.accent.primary : theme.colors.text.primary,
                backgroundColor: activeFile === filePath ? theme.colors.bg.tertiary : 'transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.xs,
              }}
              onMouseOver={(e) => {
                if (activeFile !== filePath) {
                  e.currentTarget.style.backgroundColor = theme.colors.bg.hover
                }
              }}
              onMouseOut={(e) => {
                if (activeFile !== filePath) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '12px', opacity: 0.6 }}>📄</span>
              <span>{filePath}</span>
            </div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog.visible && (
        <div style={{
          position: 'absolute',
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
            border: `1px solid ${theme.colors.border}`,
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
              Create New {showCreateDialog.type === 'file' ? 'File' : 'Folder'}
            </h3>
            <input
              type="text"
              value={createValue}
              onChange={(e) => setCreateValue(e.target.value)}
              placeholder={`Enter ${showCreateDialog.type} name...`}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.bg.secondary,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.md,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmCreate()
                } else if (e.key === 'Escape') {
                  cancelCreate()
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
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.bg.secondary,
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                disabled={!createValue.trim()}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: 'none',
                  borderRadius: theme.radius.md,
                  backgroundColor: createValue.trim() ? theme.colors.accent.primary : theme.colors.bg.tertiary,
                  color: createValue.trim() ? 'white' : theme.colors.text.tertiary,
                  cursor: createValue.trim() ? 'pointer' : 'not-allowed',
                  fontSize: theme.typography.fontSize.sm,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}