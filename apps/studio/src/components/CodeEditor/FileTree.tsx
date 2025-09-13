import { useState } from 'react'
import { FileSystemNode } from '../../utils/fileSystem'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface FileTreeProps {
  node: FileSystemNode
  level?: number
  activeFile?: string
  onFileSelect?: (filePath: string) => void
  onFileCreate?: (folderPath: string) => void
  onFolderCreate?: (folderPath: string) => void
  onDelete?: (path: string) => void
  onRename?: (oldPath: string, newName: string) => void
  onToggleExpanded?: (folderPath: string) => void
}

interface ContextMenuProps {
  x: number
  y: number
  visible: boolean
  onClose: () => void
  onCreateFile: () => void
  onCreateFolder: () => void
  onRename: () => void
  onDelete: () => void
  isFolder: boolean
}

const ContextMenu = ({ x, y, visible, onClose, onCreateFile, onCreateFolder, onRename, onDelete, isFolder }: ContextMenuProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  if (!visible) return null

  const menuItems = [
    ...(isFolder ? [
      { label: 'New File', onClick: onCreateFile, icon: '📄' },
      { label: 'New Folder', onClick: onCreateFolder, icon: '📁' },
      { label: 'separator' },
    ] : []),
    { label: 'Rename', onClick: onRename, icon: '✏️' },
    { label: 'Delete', onClick: onDelete, icon: '🗑️' },
  ]

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
          zIndex: 999,
        }}
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        style={{
          position: 'fixed',
          top: y,
          left: x,
          background: theme.colors.bg.primary,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          boxShadow: theme.shadows.md,
          zIndex: 1000,
          minWidth: '160px',
          padding: `${theme.spacing.xs} 0`,
        }}
      >
        {menuItems.map((item, index) => 
          item.label === 'separator' ? (
            <div
              key={index}
              style={{
                height: '1px',
                background: theme.colors.border,
                margin: `${theme.spacing.xs} 0`,
              }}
            />
          ) : (
            <div
              key={index}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.primary,
                transition: `background ${theme.animation.fast}`,
              }}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: '12px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        )}
      </div>
    </>
  )
}

export const FileTree = ({ 
  node, 
  level = 0, 
  activeFile, 
  onFileSelect, 
  onFileCreate,
  onFolderCreate,
  onDelete,
  onRename,
  onToggleExpanded
}: FileTreeProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    targetPath: string
    isFolder: boolean
  }>({ visible: false, x: 0, y: 0, targetPath: '', isFolder: false })
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renamingValue, setRenamingValue] = useState('')

  const getFileIcon = (filename: string, isFolder: boolean) => {
    if (isFolder) {
      return node.metadata?.isExpanded ? '📂' : '📁'
    }
    
    // More comprehensive file type icons
    if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) return '⚛️'
    if (filename.endsWith('.js') || filename.endsWith('.ts')) return '📜'
    if (filename.endsWith('.html')) return '🌐'
    if (filename.endsWith('.css') || filename.endsWith('.scss') || filename.endsWith('.sass')) return '🎨'
    if (filename.endsWith('.json')) return '📋'
    if (filename.endsWith('.md')) return '📝'
    if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.svg') || filename.endsWith('.gif')) return '🖼️'
    if (filename.endsWith('.ico')) return '🔮'
    if (filename === 'package.json') return '📦'
    if (filename === '.gitignore') return '🙈'
    if (filename === 'README.md') return '📖'
    return '📄'
  }

  const getFolderIcon = (folderName: string, isExpanded: boolean) => {
    if (folderName === 'src') return isExpanded ? '📂' : '📁'
    if (folderName === 'public') return isExpanded ? '🌍' : '🌎'
    if (folderName === 'components') return isExpanded ? '🧩' : '🔧'
    if (folderName === 'hooks') return isExpanded ? '🪝' : '🎣'
    if (folderName === 'utils') return isExpanded ? '🛠️' : '⚙️'
    if (folderName === 'assets') return isExpanded ? '📦' : '📦'
    if (folderName === 'styles') return isExpanded ? '🎨' : '🖌️'
    return isExpanded ? '📂' : '📁'
  }

  const handleContextMenu = (e: React.MouseEvent, path: string, isFolder: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetPath: path,
      isFolder
    })
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type === 'folder') {
      onToggleExpanded?.(node.path)
    } else {
      onFileSelect?.(node.path)
    }
  }

  const startRename = (path: string) => {
    setRenaming(path)
    setRenamingValue(node.name)
  }

  const handleRename = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (renamingValue.trim() && renamingValue !== node.name) {
        onRename?.(node.path, renamingValue.trim())
      }
      setRenaming(null)
    } else if (e.key === 'Escape') {
      setRenaming(null)
    }
  }

  const isSelected = activeFile === node.path
  const isExpanded = node.metadata?.isExpanded ?? false

  return (
    <>
      <div>
        {/* Current Node */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            paddingLeft: `${level * 16 + 8}px`,
            paddingRight: theme.spacing.sm,
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing.xs,
            cursor: 'pointer',
            borderRadius: theme.radius.sm,
            margin: `1px ${theme.spacing.xs}`,
            background: isSelected ? theme.colors.accent.primary + '20' : 'transparent',
            color: isSelected ? theme.colors.accent.primary : theme.colors.text.primary,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: isSelected ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
            transition: `all ${theme.animation.fast}`,
            userSelect: 'none',
          }}
          onClick={handleClick}
          onContextMenu={(e) => handleContextMenu(e, node.path, node.type === 'folder')}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = theme.colors.bg.secondary
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {/* Expand/Collapse Arrow */}
          {node.type === 'folder' && (
            <span
              style={{
                fontSize: '10px',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: `transform ${theme.animation.normal}`,
                color: theme.colors.text.secondary,
                width: '12px',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              ▶
            </span>
          )}
          
          {/* File/Folder Icon */}
          <span style={{ fontSize: '14px' }}>
            {node.type === 'folder' 
              ? getFolderIcon(node.name, isExpanded)
              : getFileIcon(node.name, false)
            }
          </span>
          
          {/* Name or Rename Input */}
          {renaming === node.path ? (
            <input
              type="text"
              value={renamingValue}
              onChange={(e) => setRenamingValue(e.target.value)}
              onKeyDown={handleRename}
              onBlur={() => setRenaming(null)}
              autoFocus
              style={{
                background: theme.colors.bg.primary,
                border: `1px solid ${theme.colors.accent.primary}`,
                borderRadius: theme.radius.sm,
                padding: '2px 4px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.primary,
                outline: 'none',
                minWidth: '80px',
              }}
            />
          ) : (
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {node.name}
            </span>
          )}
          
          {/* Active File Indicator */}
          {isSelected && node.type === 'file' && (
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: theme.colors.accent.primary,
                flexShrink: 0,
                marginLeft: 'auto',
              }}
            />
          )}
        </div>

        {/* Children (if folder is expanded) */}
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {Object.entries(node.children)
              .sort(([, a], [, b]) => {
                // Folders first, then files
                if (a.type !== b.type) {
                  return a.type === 'folder' ? -1 : 1
                }
                // Alphabetical within each type
                return a.name.localeCompare(b.name)
              })
              .map(([name, child]) => (
                <FileTree
                  key={name}
                  node={child}
                  level={level + 1}
                  activeFile={activeFile}
                  onFileSelect={onFileSelect}
                  onFileCreate={onFileCreate}
                  onFolderCreate={onFolderCreate}
                  onDelete={onDelete}
                  onRename={onRename}
                  onToggleExpanded={onToggleExpanded}
                />
              ))
            }
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        isFolder={contextMenu.isFolder}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onCreateFile={() => onFileCreate?.(contextMenu.targetPath)}
        onCreateFolder={() => onFolderCreate?.(contextMenu.targetPath)}
        onRename={() => startRename(contextMenu.targetPath)}
        onDelete={() => onDelete?.(contextMenu.targetPath)}
      />
    </>
  )
}