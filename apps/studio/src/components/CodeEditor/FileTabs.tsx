import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface FileTabsProps {
  files: Record<string, string>
  activeFile: string
  onFileSelect: (file: string) => void
}

export const FileTabs = ({ files, activeFile, onFileSelect }: FileTabsProps) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return '🌐'
    if (filename.endsWith('.css')) return '🎨'
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return '⚡'
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return '🔷'
    return '📄'
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
          <span style={{ fontSize: theme.typography.fontSize.sm }}>{getFileIcon(filename)}</span>
          <span>{filename}</span>
        </button>
      ))}
    </div>
  )
}