import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getTheme } from '../../styles/theme'

interface ThinkingSectionProps {
  thinking: string
  isVisible?: boolean
}

export const ThinkingSection = ({ thinking, isVisible = true }: ThinkingSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { mode } = useTheme()
  const theme = getTheme(mode)

  if (!isVisible || !thinking) return null

  // Extract the first line as summary, rest as detailed thinking
  const lines = thinking.split('\n').filter(line => line.trim())
  const summary = lines[0] || thinking.slice(0, 100) + '...'
  const hasMoreContent = lines.length > 1 || thinking.length > 100

  return (
    <div style={{
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.lg,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.bg.secondary,
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          color: theme.colors.text.secondary,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          cursor: hasMoreContent ? 'pointer' : 'default',
          textAlign: 'left',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          if (hasMoreContent) {
            e.currentTarget.style.backgroundColor = theme.colors.bg.tertiary
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        {hasMoreContent && (
          <div style={{
            fontSize: '12px',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: theme.colors.text.tertiary,
          }}>
            ▶
          </div>
        )}
        <div style={{
          fontSize: '14px',
          marginRight: theme.spacing.sm,
          opacity: 0.7,
        }}>
          🤔
        </div>
        <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
          Thinking
        </span>
        {!isExpanded && hasMoreContent && (
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.tertiary,
            marginLeft: theme.spacing.sm,
            opacity: 0.8,
          }}>
            •
          </div>
        )}
      </button>

      {isExpanded && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          backgroundColor: theme.colors.bg.primary,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            lineHeight: theme.typography.lineHeight.relaxed,
            whiteSpace: 'pre-wrap',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}>
            {thinking}
          </div>
        </div>
      )}

      {!isExpanded && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          backgroundColor: theme.colors.bg.primary,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            lineHeight: theme.typography.lineHeight.relaxed,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.text.tertiary,
              opacity: 0.5,
            }} />
            <span style={{ opacity: 0.8 }}>
              {summary}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}