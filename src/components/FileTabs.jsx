import { useTheme } from '../contexts/ThemeContext'
import { getTheme } from '../styles/theme'

export const FileTabs = ({ files, activeFile, onFileSelect, onFileClose }) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  const getFileTypeColor = (filename) => {
    if (filename.endsWith('.html')) return '#e34c26'
    if (filename.endsWith('.css')) return '#9d79d6'
    if (filename.endsWith('.js')) return '#f0db4f'
    if (filename.endsWith('.jsx')) return '#61dafb'
    return theme.colors.text.secondary
  }

  const fileList = Object.keys(files)

  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.xs,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      background: theme.colors.bg.secondary,
      borderBottom: `1px solid ${theme.colors.bg.border}`,
      overflowX: 'auto',
    }}>
      {fileList.map(filename => (
        <div
          key={filename}
          onClick={() => onFileSelect(filename)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: activeFile === filename ? theme.colors.bg.primary : 'transparent',
            color: activeFile === filename ? theme.colors.text.primary : theme.colors.text.secondary,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.sm,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            border: `1px solid ${activeFile === filename ? theme.colors.bg.border : 'transparent'}`,
          }}
        >
          <span>
            {filename.substring(0, filename.lastIndexOf('.'))}
            <span style={{
              color: getFileTypeColor(filename),
              fontWeight: theme.typography.fontWeight.bold
            }}>
              {filename.substring(filename.lastIndexOf('.'))}
            </span>
          </span>
          {onFileClose && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFileClose(filename)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.tertiary,
                cursor: 'pointer',
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                fontFamily: theme.typography.fontFamily.sans,
                borderRadius: theme.radius.lg,
                transition: `all ${theme.animation.normal}`,
                boxShadow: theme.shadows.outset,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
