import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'
import { FileTree } from './FileTree'
import { FileSystemManager, createReactProjectTemplate } from '../../utils/fileSystem'

interface FileExplorerProps {
  files: Record<string, string>
  activeFile: string
  onFileSelect: (filename: string) => void
  onFileChange?: (filename: string, content: string) => void
  onFileCreate?: (filename: string, content: string) => void
  onFileDelete?: (filename: string) => void
  onFileRename?: (oldFilename: string, newFilename: string) => void
  onClose?: () => void
  onToggle?: () => void
}

export const FileExplorer = ({ 
  files, 
  activeFile, 
  onFileSelect, 
  onFileChange,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onClose, 
  onToggle 
}: FileExplorerProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [fileSystem, setFileSystem] = useState<FileSystemManager | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState<{
    visible: boolean
    type: 'file' | 'folder'
    parentPath: string
  }>({ visible: false, type: 'file', parentPath: '' })
  const [createValue, setCreateValue] = useState('')
  const createInputRef = useRef<HTMLInputElement>(null)

  // Initialize file system when files change
  useEffect(() => {
    const fs = new FileSystemManager(files)
    setFileSystem(fs)
  }, [files])

  const handleFileSelect = (filePath: string) => {
    onFileSelect(filePath)
  }

  const handleToggleExpanded = (folderPath: string) => {
    if (fileSystem) {
      fileSystem.toggleExpanded(folderPath)
      setFileSystem(new FileSystemManager(fileSystem.toFlatStructure()))
    }
  }

  const handleFileCreate = (parentPath: string) => {
    setShowCreateDialog({
      visible: true,
      type: 'file',
      parentPath
    })
    setCreateValue('')
  }

  const handleFolderCreate = (parentPath: string) => {
    setShowCreateDialog({
      visible: true,
      type: 'folder',
      parentPath
    })
    setCreateValue('')
  }

  const handleCreateConfirm = () => {
    if (!createValue.trim() || !fileSystem) return

    const { type, parentPath } = showCreateDialog
    const fullPath = parentPath ? `${parentPath}/${createValue.trim()}` : createValue.trim()

    if (type === 'file') {
      const extension = fullPath.split('.').pop()?.toLowerCase()
      let defaultContent = ''

      // Set default content based on file type
      if (extension === 'jsx' || extension === 'tsx') {
        const componentName = createValue.split('.')[0]
        defaultContent = `import React from 'react'

const ${componentName} = () => {
  return (
    <div>
      <h1>${componentName} Component</h1>
    </div>
  )
}

export default ${componentName}`
      } else if (extension === 'js' || extension === 'ts') {
        defaultContent = `// ${createValue.split('.')[0]} utility functions

export const ${createValue.split('.')[0]} = () => {
  // Add your logic here
}`
      } else if (extension === 'css') {
        defaultContent = `/* ${createValue} styles */

.container {
  /* Add your styles here */
}`
      } else if (extension === 'json') {
        defaultContent = '{\n  \n}'
      } else if (extension === 'md') {
        defaultContent = `# ${createValue.split('.')[0]}\n\nAdd your documentation here.`
      }

      fileSystem.createFile(fullPath, defaultContent)
      onFileCreate?.(fullPath, defaultContent)
    } else {
      fileSystem.createFolder(fullPath)
    }

    setFileSystem(new FileSystemManager(fileSystem.toFlatStructure()))
    setShowCreateDialog({ visible: false, type: 'file', parentPath: '' })
  }

  const handleDelete = (path: string) => {
    if (!fileSystem) return
    
    const confirmed = window.confirm(`Are you sure you want to delete "${path}"?`)
    if (confirmed) {
      fileSystem.delete(path)
      onFileDelete?.(path)
      setFileSystem(new FileSystemManager(fileSystem.toFlatStructure()))
      
      // If deleted file was active, select another file
      if (activeFile === path) {
        const allFiles = fileSystem.getAllFiles()
        if (allFiles.length > 0) {
          onFileSelect(allFiles[0].path)
        }
      }
    }
  }

  const handleRename = (oldPath: string, newName: string) => {
    if (!fileSystem) return
    
    fileSystem.rename(oldPath, newName)
    const newPath = oldPath.split('/').slice(0, -1).concat(newName).join('/')
    
    onFileRename?.(oldPath, newPath)
    setFileSystem(new FileSystemManager(fileSystem.toFlatStructure()))
    
    // If renamed file was active, update active file
    if (activeFile === oldPath) {
      onFileSelect(newPath)
    }
  }

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateConfirm()
    } else if (e.key === 'Escape') {
      setShowCreateDialog({ visible: false, type: 'file', parentPath: '' })
    }
  }

  const initializeReactProject = () => {
    const reactTemplate = createReactProjectTemplate()
    const fs = new FileSystemManager(reactTemplate)
    setFileSystem(fs)
    
    // Expand key folders by default
    fs.toggleExpanded('src')
    fs.toggleExpanded('public')
    fs.toggleExpanded('src/components')
    fs.toggleExpanded('src/components/Button')
    
    setFileSystem(new FileSystemManager(fs.toFlatStructure()))
    
    // Notify parent about the new files
    Object.entries(reactTemplate).forEach(([path, content]) => {
      onFileCreate?.(path, content)
    })
    
    // Select App.js by default
    onFileSelect('src/App.js')
  }

  const totalFiles = fileSystem ? fileSystem.getAllFiles().length : Object.keys(files).length

  if (!fileSystem) {
    return (
      <div style={{
        width: '280px',
        height: '100%',
        background: theme.colors.bg.secondary,
        borderRight: `1px solid ${theme.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
        }}>
          Loading...
        </div>
      </div>
    )
  }

  const rootStructure = fileSystem.getFolderStructure()
  const isEmpty = !rootStructure.children || Object.keys(rootStructure.children).length === 0

  return (
    <div style={{
      width: '280px',
      height: '100%',
      background: theme.colors.bg.secondary,
      borderRight: `1px solid ${theme.colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bg.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <span style={{ fontSize: '14px' }}>📁</span>
          <span>Explorer</span>
        </div>
        
        {isEmpty && (
          <button
            onClick={initializeReactProject}
            style={{
              background: theme.colors.accent.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.radius.sm,
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
              fontSize: theme.typography.fontSize.xs,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
            }}
          >
            <span>⚛️</span>
            <span>React</span>
          </button>
        )}
      </div>

      {/* File Tree */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {isEmpty ? (
          <div style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.fontSize.sm,
          }}>
            <div style={{ fontSize: '48px', marginBottom: theme.spacing.md, opacity: 0.5 }}>
              📁
            </div>
            <div style={{ marginBottom: theme.spacing.md }}>
              <strong>No files yet</strong>
            </div>
            <div style={{ marginBottom: theme.spacing.lg, lineHeight: 1.5 }}>
              Start by creating a React project or add files manually using right-click context menu.
            </div>
            <button
              onClick={initializeReactProject}
              style={{
                background: theme.colors.accent.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.radius.md,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              <span style={{ fontSize: '16px' }}>⚛️</span>
              <span>Create React Project</span>
            </button>
          </div>
        ) : (
          rootStructure.children && Object.entries(rootStructure.children)
            .sort(([, a], [, b]) => {
              // Folders first, then files
              if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1
              }
              // Alphabetical within each type
              return a.name.localeCompare(b.name)
            })
            .map(([name, node]) => (
              <FileTree
                key={name}
                node={node}
                activeFile={activeFile}
                onFileSelect={handleFileSelect}
                onFileCreate={handleFileCreate}
                onFolderCreate={handleFolderCreate}
                onDelete={handleDelete}
                onRename={handleRename}
                onToggleExpanded={handleToggleExpanded}
              />
            ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        borderTop: `1px solid ${theme.colors.border}`,
        background: theme.colors.bg.tertiary,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
      }}>
        {totalFiles} file{totalFiles !== 1 ? 's' : ''}
      </div>

      {/* Create Dialog */}
      {showCreateDialog.visible && (
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowCreateDialog({ visible: false, type: 'file', parentPath: '' })}
          >
            {/* Dialog */}
            <div
              style={{
                background: theme.colors.bg.primary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
                minWidth: '300px',
                boxShadow: theme.shadows.lg,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.md,
              }}>
                Create {showCreateDialog.type === 'file' ? 'File' : 'Folder'}
              </div>
              
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.sm,
              }}>
                {showCreateDialog.parentPath ? `in ${showCreateDialog.parentPath}/` : 'in root/'}
              </div>

              <input
                ref={createInputRef}
                type="text"
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                placeholder={showCreateDialog.type === 'file' ? 'filename.ext' : 'folder-name'}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.primary,
                  background: theme.colors.bg.secondary,
                  outline: 'none',
                  marginBottom: theme.spacing.md,
                }}
                autoFocus
              />

              <div style={{
                display: 'flex',
                gap: theme.spacing.sm,
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={() => setShowCreateDialog({ visible: false, type: 'file', parentPath: '' })}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.md,
                    background: theme.colors.bg.secondary,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.sm,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConfirm}
                  disabled={!createValue.trim()}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    border: 'none',
                    borderRadius: theme.radius.md,
                    background: createValue.trim() ? theme.colors.accent.primary : theme.colors.bg.tertiary,
                    color: createValue.trim() ? 'white' : theme.colors.text.tertiary,
                    fontSize: theme.typography.fontSize.sm,
                    cursor: createValue.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}