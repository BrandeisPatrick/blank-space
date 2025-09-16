import React from 'react'
import { ResponseMode, RESPONSE_MODES } from '../../types'
import { useTheme } from '../../pages/ThemeContext'
import { getTheme } from '../../styles/theme'

interface ResponseModeToggleProps {
  currentMode: ResponseMode
  onModeChange: (mode: ResponseMode) => void
  className?: string
}

export const ResponseModeToggle: React.FC<ResponseModeToggleProps> = ({
  currentMode,
  onModeChange,
  className = ''
}) => {
  const modes = Object.values(RESPONSE_MODES)
  const { mode } = useTheme()
  const theme = getTheme(mode)

  return (
    <div className={`response-mode-toggle ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    }}>
      <div style={{
        display: 'flex',
        background: theme.colors.bg.secondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.xs,
        boxShadow: theme.shadows.md,
      }}>
        {modes.map((modeItem) => (
          <button
            key={modeItem.id}
            onClick={() => onModeChange(modeItem.id)}
            title={modeItem.description}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              border: 'none',
              background: currentMode === modeItem.id 
                ? mode === 'dark' ? theme.colors.gradient.button : theme.colors.gradient.primary
                : 'transparent',
              borderRadius: theme.radius.md,
              cursor: 'pointer',
              transition: `all ${theme.animation.normal}`,
              color: currentMode === modeItem.id 
                ? mode === 'dark' ? '#ffffff' : theme.colors.accent.primary
                : theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
              fontWeight: currentMode === modeItem.id 
                ? theme.typography.fontWeight.bold 
                : theme.typography.fontWeight.medium,
              height: '48px',
              boxShadow: currentMode === modeItem.id 
                ? theme.shadows.outset
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (currentMode !== modeItem.id) {
                e.currentTarget.style.background = theme.colors.bg.hover
                e.currentTarget.style.color = theme.colors.text.primary
              }
            }}
            onMouseLeave={(e) => {
              if (currentMode !== modeItem.id) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = theme.colors.text.secondary
              }
            }}
          >
            <span style={{ fontSize: theme.typography.fontSize.lg }}>{modeItem.icon}</span>
            <span>{modeItem.label}</span>
          </button>
        ))}
      </div>
      
      <div style={{ padding: `0 ${theme.spacing.xs}` }}>
        <span style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          fontStyle: 'italic',
        }}>
          {RESPONSE_MODES[currentMode].description}
        </span>
      </div>
    </div>
  )
}

export default ResponseModeToggle