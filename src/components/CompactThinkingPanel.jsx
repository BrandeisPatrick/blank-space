import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getTheme } from '../styles/theme'

export const CompactThinkingPanel = ({
  phase,
  steps,
  answer = '',
  isVisible = true,
  onToggleVisibility,
  className = ''
}) => {
  const { mode } = useTheme()
  const theme = getTheme(mode)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-expand when thinking or streaming starts (to show steps)
  useEffect(() => {
    if ((phase === 'thinking' || phase === 'streaming') && steps.length > 0) {
      setIsCollapsed(false)
    }
  }, [phase, steps.length])

  // Auto-collapse after completion
  useEffect(() => {
    if (phase === 'done' && !isCollapsed) {
      const timer = setTimeout(() => setIsCollapsed(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [phase, isCollapsed])

  const renderChip = useCallback((step) => {
    const getChipStyles = () => {
      const baseStyles = {
        background: 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${theme.colors.border}`,
        color: theme.colors.text.secondary,
        padding: '6px 12px',
        borderRadius: '999px',
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        minHeight: '28px',
        width: '100%'
      }

      switch (step.status) {
        case 'active':
          return {
            ...baseStyles,
            borderColor: theme.colors.accent.primary,
            color: theme.colors.text.primary,
            background: `${theme.colors.accent.primary}10`
          }
        case 'complete':
          return {
            ...baseStyles,
            borderColor: theme.colors.status.success,
            color: theme.colors.status.success,
            background: `${theme.colors.status.success}10`
          }
        case 'error':
          return {
            ...baseStyles,
            borderColor: theme.colors.status.error,
            color: theme.colors.status.error,
            background: `${theme.colors.status.error}10`
          }
        default:
          return baseStyles
      }
    }

    const renderSpinner = () => (
      <div
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          border: `2px solid ${theme.colors.text.tertiary}`,
          borderRightColor: theme.colors.accent.primary,
          animation: 'spin 0.7s linear infinite',
        }}
      />
    )

    return (
      <div key={step.id} style={getChipStyles()}>
        {step.status === 'active' && renderSpinner()}
        {step.status === 'complete' && <span style={{ color: theme.colors.status.success }}>✓</span>}
        {step.status === 'error' && <span style={{ color: theme.colors.status.error }}>✗</span>}
        <span>{step.label}</span>
      </div>
    )
  }, [theme])

  const renderThinkingDots = () => (
    <span
      style={{
        display: 'inline-block',
        width: '1.2em',
        textAlign: 'left',
        animation: phase === 'thinking' ? 'ellipses 1.2s steps(4, end) infinite' : 'none',
        color: theme.colors.text.tertiary
      }}
    >
      {phase === 'thinking' ? '' : ''}
    </span>
  )

  if (!isVisible) return null

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @keyframes ellipses {
            0% { content: " "; }
            25% { content: "."; }
            50% { content: ".."; }
            75% { content: "..."; }
            100% { content: " "; }
          }

          @keyframes pulse-border {
            0%, 100% {
              background: conic-gradient(from 0deg, rgba(255, 255, 255, 0.9), rgba(180, 180, 180, 0.7), rgba(255, 255, 255, 0.9));
            }
            50% {
              background: conic-gradient(from 180deg, rgba(255, 255, 255, 0.9), rgba(180, 180, 180, 0.7), rgba(255, 255, 255, 0.9));
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .compact-thinking-panel * {
              animation: none !important;
            }
          }
        `}
      </style>

      <div
        className={`compact-thinking-panel ${className}`}
        role="status"
        aria-live="polite"
        aria-busy={phase === 'thinking' || phase === 'streaming'}
        style={{
          width: '100%',
          borderRadius: theme.radius.lg,
          background: theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: theme.spacing.md,
          boxShadow: mode === 'dark'
            ? '0 10px 35px rgba(0, 0, 0, 0.3)'
            : theme.shadows.outset
        }}
      >
        {/* Animated gradient border */}
        {(phase === 'thinking' || phase === 'streaming') && (
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: theme.radius.lg,
              background: `conic-gradient(from 0deg, rgba(255, 255, 255, 0.9), rgba(180, 180, 180, 0.7), rgba(255, 255, 255, 0.9))`,
              filter: 'blur(12px) opacity(0.6)',
              animation: 'pulse-border 6s linear infinite',
              zIndex: 0,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: theme.colors.bg.secondary,
            borderBottom: isCollapsed ? 'none' : `1px solid ${theme.colors.border}`
          }}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: 'pointer',
              padding: theme.spacing.xs
            }}
          >
            <div
              style={{
                transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                transition: 'transform 0.2s ease',
                color: theme.colors.text.tertiary,
                fontSize: '12px'
              }}
            >
              ▶
            </div>
            <span style={{ color: theme.colors.text.primary }}>🧠</span>
            <span>Assistant</span>
            {phase === 'thinking' && renderThinkingDots()}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            {onToggleVisibility && (
              <button
                onClick={onToggleVisibility}
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.bg.tertiary,
                  color: theme.colors.text.primary,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.xs
                }}
              >
                Hide thinking
              </button>
            )}
          </div>
        </div>

        {/* Thinking Row - Only show if not collapsed */}
        {!isCollapsed && (phase === 'thinking' || phase === 'streaming' || steps.length > 0) && (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: theme.spacing.md,
              borderBottom: answer ? `1px solid ${theme.colors.border}` : 'none'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm
              }}
            >
              {steps.map(renderChip)}
            </div>
          </div>
        )}

        {/* Answer Row - Only show if we have an answer and not collapsed */}
        {!isCollapsed && answer && (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: theme.spacing.md,
              padding: theme.spacing.md
            }}
          >
            <div
              style={{
                color: theme.colors.text.secondary,
                display: 'flex',
                alignItems: 'flex-start',
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.sm,
                paddingTop: theme.spacing.xs
              }}
            >
              Answer
            </div>

            <div>
              <div
                style={{
                  background: theme.colors.bg.tertiary,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  fontSize: theme.typography.fontSize.sm,
                  lineHeight: theme.typography.lineHeight.relaxed,
                  whiteSpace: 'pre-wrap',
                  color: theme.colors.text.primary,
                  minHeight: '80px'
                }}
              >
                {answer}
              </div>
              <div
                style={{
                  color: theme.colors.text.tertiary,
                  fontSize: theme.typography.fontSize.xs,
                  marginTop: theme.spacing.xs
                }}
              >
                {phase === 'streaming' ? 'Streaming…' : phase === 'done' ? 'Complete' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
