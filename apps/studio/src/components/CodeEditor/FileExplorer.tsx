import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface FileExplorerProps {
  files: Record<string, string>
  activeFile: string
  onFileSelect: (filename: string) => void
  onClose?: () => void
  onToggle?: () => void
}

export const FileExplorer = ({ files, activeFile, onFileSelect, onClose, onToggle }: FileExplorerProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return '🌐'
    if (filename.endsWith('.css')) return '🎨'
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return '⚡'
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return '📘'
    if (filename.endsWith('.json')) return '📋'
    if (filename.endsWith('.md')) return '📝'
    if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.svg')) return '🖼️'
    return '📄'
  }

  const organizeFiles = () => {
    const fileNames = Object.keys(files)
    
    // Simple organization: group by extension
    const organized: Record<string, string[]> = {
      'HTML': [],
      'CSS': [],
      'JavaScript': [],
      'TypeScript': [],
      'Assets': [],
      'Other': []
    }

    fileNames.forEach(filename => {
      if (filename.endsWith('.html')) organized['HTML'].push(filename)
      else if (filename.endsWith('.css')) organized['CSS'].push(filename)
      else if (filename.endsWith('.js') || filename.endsWith('.jsx')) organized['JavaScript'].push(filename)
      else if (filename.endsWith('.ts') || filename.endsWith('.tsx')) organized['TypeScript'].push(filename)
      else if (filename.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) organized['Assets'].push(filename)
      else organized['Other'].push(filename)
    })

    // Remove empty categories
    Object.keys(organized).forEach(category => {
      if (organized[category].length === 0) {
        delete organized[category]
      }
    })

    return organized
  }

  const organizedFiles = organizeFiles()

  const toggleCategory = (category: string) => {
    setCollapsed(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getFolderIcon = (category: string, isCollapsed: boolean) => {
    if (isCollapsed) return '📁'
    return '📂'
  }

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

      {/* File Tree */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: theme.spacing.sm,
      }}>
        {Object.entries(organizedFiles).map(([category, fileList]) => (
          <div key={category} style={{ marginBottom: theme.spacing.sm }}>
            {/* Category Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                cursor: 'pointer',
                borderRadius: theme.radius.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.secondary,
                transition: `all ${theme.animation.normal}`,
                userSelect: 'none',
              }}
              onClick={() => toggleCategory(category)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.bg.primary
                e.currentTarget.style.color = theme.colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = theme.colors.text.secondary
              }}
            >
              <span style={{
                transform: collapsed[category] ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: `transform ${theme.animation.normal}`,
                fontSize: '12px',
              }}>
                ▼
              </span>
              <span>{getFolderIcon(category, collapsed[category])}</span>
              <span>{category}</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.tertiary,
              }}>
                {fileList.length}
              </span>
            </div>

            {/* Files in Category */}
            {!collapsed[category] && (
              <div style={{ marginLeft: theme.spacing.lg }}>
                {fileList.map(filename => (
                  <div
                    key={filename}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      cursor: 'pointer',
                      borderRadius: theme.radius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: activeFile === filename ? theme.colors.accent.primary : theme.colors.text.primary,
                      background: activeFile === filename ? theme.colors.accent.primary + '20' : 'transparent',
                      fontWeight: activeFile === filename ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal,
                      transition: `all ${theme.animation.normal}`,
                    }}
                    onClick={() => onFileSelect(filename)}
                    onMouseEnter={(e) => {
                      if (activeFile !== filename) {
                        e.currentTarget.style.background = theme.colors.bg.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeFile !== filename) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <span>{getFileIcon(filename)}</span>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {filename}
                    </span>
                    {activeFile === filename && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: theme.colors.accent.primary,
                        marginLeft: 'auto',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(organizedFiles).length === 0 && (
          <div style={{
            padding: theme.spacing.lg,
            textAlign: 'center',
            color: theme.colors.text.tertiary,
            fontSize: theme.typography.fontSize.sm,
          }}>
            <div style={{ fontSize: '32px', marginBottom: theme.spacing.md, opacity: 0.5 }}>
              📁
            </div>
            <div>No files to display</div>
          </div>
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
        {Object.keys(files).length} file{Object.keys(files).length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}