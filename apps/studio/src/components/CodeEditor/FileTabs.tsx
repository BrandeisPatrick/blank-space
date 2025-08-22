import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface FileTabsProps {
  files: Record<string, string>
  activeFile: string
  onFileSelect: (file: string) => void
  onFileClose?: (file: string) => void
  showExplorer: boolean
  onToggleExplorer: () => void
}

export const FileTabs = ({ files, activeFile, onFileSelect, onFileClose, showExplorer, onToggleExplorer }: FileTabsProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  
  const getFileTypeColor = (filename: string) => {
    if (filename.endsWith('.html')) return '#e34c26' // HTML orange
    if (filename.endsWith('.css')) return '#1572b6' // CSS blue
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return '#f7df1e' // JavaScript yellow
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return '#3178c6' // TypeScript blue
    if (filename.endsWith('.json')) return '#5a9e3f' // JSON green
    return theme.colors.text.secondary // Default gray
  }
  
  const getFileTypeLabel = (filename: string) => {
    if (filename.endsWith('.html')) return 'HTML'
    if (filename.endsWith('.css')) return 'CSS'
    if (filename.endsWith('.js')) return 'JS'
    if (filename.endsWith('.jsx')) return 'JSX'
    if (filename.endsWith('.ts')) return 'TS'
    if (filename.endsWith('.tsx')) return 'TSX'
    if (filename.endsWith('.json')) return 'JSON'
    return 'FILE'
  }


  return (
    <div style={{
      display: 'flex',
      background: theme.colors.bg.secondary,
      borderBottom: `1px solid ${theme.colors.border}`,
      height: '48px',
      overflow: 'hidden',
      padding: theme.spacing.xs,
      gap: theme.spacing.xs,
    }}>
      {/* File Explorer Tab */}
      <button
        onClick={onToggleExplorer}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          background: showExplorer ? theme.colors.gradient.primary : theme.colors.bg.primary,
          color: showExplorer ? theme.colors.accent.primary : theme.colors.text.secondary,
          border: 'none',
          borderRadius: theme.radius.md,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: showExplorer ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
          cursor: 'pointer',
          minWidth: '120px',
          position: 'relative',
          transition: `all ${theme.animation.normal}`,
          boxShadow: showExplorer ? theme.shadows.sm : theme.shadows.outset,
        }}
        onMouseEnter={(e) => {
          if (!showExplorer) {
            e.currentTarget.style.background = theme.colors.bg.hover
            e.currentTarget.style.color = theme.colors.accent.primary
            e.currentTarget.style.boxShadow = theme.shadows.glow
          }
        }}
        onMouseLeave={(e) => {
          if (!showExplorer) {
            e.currentTarget.style.background = theme.colors.bg.primary
            e.currentTarget.style.color = theme.colors.text.secondary
            e.currentTarget.style.boxShadow = theme.shadows.outset
          }
        }}
      >
        {/* Folder Icon */}
        <div style={{
          width: '16px',
          height: '13px',
          position: 'relative',
          marginRight: '2px',
        }}>
          {/* Folder tab */}
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '7px',
            height: '3px',
            background: showExplorer ? theme.colors.accent.primary : theme.colors.text.secondary,
            borderRadius: '2px 2px 0 0',
            transition: `background ${theme.animation.normal}`,
          }} />
          {/* Folder body */}
          <div style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '10px',
            background: showExplorer ? theme.colors.accent.primary : theme.colors.text.secondary,
            borderRadius: '2px',
            transition: `background ${theme.animation.normal}`,
          }} />
        </div>
        <span>Explorer</span>
      </button>

      {Object.keys(files).map((filename) => (
        <button
          key={filename}
          onClick={() => onFileSelect(filename)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            background: activeFile === filename ? theme.colors.gradient.primary : theme.colors.bg.primary,
            color: activeFile === filename ? theme.colors.accent.primary : theme.colors.text.secondary,
            border: 'none',
            borderRadius: theme.radius.md,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: activeFile === filename ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
            cursor: 'pointer',
            minWidth: '120px',
            position: 'relative',
            transition: `all ${theme.animation.normal}`,
            boxShadow: activeFile === filename ? theme.shadows.sm : theme.shadows.outset,
          }}
          onMouseEnter={(e) => {
            if (activeFile !== filename) {
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.color = theme.colors.accent.primary
              e.currentTarget.style.boxShadow = theme.shadows.glow
            }
          }}
          onMouseLeave={(e) => {
            if (activeFile !== filename) {
              e.currentTarget.style.background = theme.colors.bg.primary
              e.currentTarget.style.color = theme.colors.text.secondary
              e.currentTarget.style.boxShadow = theme.shadows.outset
            }
          }}
        >
          {/* File Type Indicator */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getFileTypeColor(filename),
            flexShrink: 0,
            boxShadow: activeFile === filename 
              ? `0 0 6px ${getFileTypeColor(filename)}60` 
              : 'none',
            transition: `all ${theme.animation.normal}`,
          }} />
          
          <span style={{
            flex: 1,
            textAlign: 'left',
          }}>{filename}</span>
          
          {/* File Type Badge */}
          <span style={{
            fontSize: '9px',
            fontWeight: theme.typography.fontWeight.bold,
            color: activeFile === filename 
              ? getFileTypeColor(filename) 
              : theme.colors.text.tertiary,
            background: activeFile === filename
              ? `${getFileTypeColor(filename)}20`
              : theme.colors.bg.secondary,
            padding: '1px 4px',
            borderRadius: '3px',
            marginLeft: 'auto',
            flexShrink: 0,
            transition: `all ${theme.animation.normal}`,
          }}>
            {getFileTypeLabel(filename)}
          </span>
          
          {/* Close Button */}
          {onFileClose && Object.keys(files).length > 1 && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onFileClose(filename)
              }}
              style={{
                marginLeft: theme.spacing.sm,
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                cursor: 'pointer',
                color: theme.colors.text.tertiary,
                fontSize: '12px',
                fontWeight: theme.typography.fontWeight.bold,
                transition: `all ${theme.animation.normal}`,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.accent.error + '20'
                e.currentTarget.style.color = theme.colors.accent.error
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = theme.colors.text.tertiary
              }}
            >
              ×
            </div>
          )}
        </button>
      ))}
    </div>
  )
}